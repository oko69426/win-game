"""
WINGAME AI - 體育 API 服務
整合:
  - Football-Data.org (足球，需免費 API Key)
  - statsapi.mlb.com (MLB，免費無需 Key)
  - TheSportsDB.com (備用，免費)
"""
import requests
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import FOOTBALL_DATA_API_KEY, CACHE_TTL
from utils.db import get_cached_response, save_cached_response

FOOTBALL_DATA_BASE = "https://api.football-data.org/v4"
MLB_BASE = "https://statsapi.mlb.com/api/v1"
SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3"

# 請求超時 (秒)
REQUEST_TIMEOUT = 8


def fetch_team_history(home_team: str, away_team: str, sport_type: str) -> dict:
    """
    主要入口: 根據運動類型路由到對應 API
    返回標準化歷史數據 dict
    """
    try:
        if sport_type == 'baseball':
            return _fetch_baseball_history(home_team, away_team)
        else:
            return _fetch_soccer_history(home_team, away_team)
    except Exception as e:
        print(f"API 查詢失敗，使用中性預設值: {e}")
        return _get_neutral_features(sport_type)


def _cached_get(url: str, headers: dict = None) -> dict:
    """有快取的 HTTP GET 請求"""
    cached = get_cached_response(url)
    if cached:
        return cached

    try:
        resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        save_cached_response(url, data, ttl=CACHE_TTL)
        return data
    except requests.exceptions.Timeout:
        print(f"API 請求超時: {url}")
        return {}
    except requests.exceptions.RequestException as e:
        print(f"API 請求失敗: {url} -> {e}")
        return {}


def _fetch_soccer_history(home_team: str, away_team: str) -> dict:
    """查詢足球歷史數據"""
    features = _get_neutral_features('soccer')
    features['api_source'] = 'none'

    # 嘗試 TheSportsDB (不需要 API Key)
    home_data = _cached_get(
        f"{SPORTSDB_BASE}/searchteams.php?t={requests.utils.quote(home_team)}"
    )
    away_data = _cached_get(
        f"{SPORTSDB_BASE}/searchteams.php?t={requests.utils.quote(away_team)}"
    )

    home_teams = home_data.get('teams') or []
    away_teams = away_data.get('teams') or []

    if home_teams:
        features['api_source'] = 'thesportsdb'
        features['api_available'] = True
        # TheSportsDB 提供基本球隊資訊，可以提取聯賽資訊
        team_info = home_teams[0]
        # 根據聯賽調整主場優勢估計
        league = team_info.get('strLeague', '').lower()
        if 'premier' in league or 'bundesliga' in league:
            features['home_win_rate'] = 0.48  # 頂級聯賽主場優勢略低
        else:
            features['home_win_rate'] = 0.52

    # 若有 Football-Data API Key，使用更詳細的數據
    if FOOTBALL_DATA_API_KEY:
        headers = {"X-Auth-Token": FOOTBALL_DATA_API_KEY}
        fd_data = _fetch_football_data_stats(home_team, away_team, headers)
        if fd_data.get('api_available'):
            features.update(fd_data)

    return features


def _fetch_football_data_stats(home_team: str, away_team: str, headers: dict) -> dict:
    """Football-Data.org 詳細數據 (需要 API Key)"""
    # 搜尋球隊 ID
    search_url = f"{FOOTBALL_DATA_BASE}/teams?name={requests.utils.quote(home_team)}"
    data = _cached_get(search_url, headers=headers)

    teams = data.get('teams', [])
    if not teams:
        return {}

    home_id = teams[0].get('id')
    if not home_id:
        return {}

    # 取得近期比賽
    matches_url = f"{FOOTBALL_DATA_BASE}/teams/{home_id}/matches?status=FINISHED&limit=10"
    matches_data = _cached_get(matches_url, headers=headers)
    matches = matches_data.get('matches', [])

    if not matches:
        return {}

    # 計算主場勝率
    home_wins = sum(1 for m in matches
                    if m.get('homeTeam', {}).get('id') == home_id
                    and m.get('score', {}).get('winner') == 'HOME_TEAM')
    total_home = sum(1 for m in matches
                     if m.get('homeTeam', {}).get('id') == home_id)

    home_win_rate = (home_wins / total_home) if total_home > 0 else 0.50

    # 計算平均進球
    total_goals = sum(
        (m.get('score', {}).get('fullTime', {}).get('home', 0) or 0) +
        (m.get('score', {}).get('fullTime', {}).get('away', 0) or 0)
        for m in matches[:10]
    )
    avg_goals = total_goals / max(len(matches), 1)

    return {
        'api_available': True,
        'api_source': 'football-data.org',
        'home_win_rate': round(home_win_rate, 3),
        'home_avg_goals': round(avg_goals * 0.55, 2),  # 主隊貢獻估計
        'away_avg_goals': round(avg_goals * 0.45, 2),
        'home_form_score': round(home_win_rate * 100, 1),
    }


def _fetch_baseball_history(home_team: str, away_team: str) -> dict:
    """查詢 MLB 歷史數據 (本季積分榜 + 近期場次滾動勝率)"""
    features = _get_neutral_features('baseball')

    # MLB Stats API - 免費無需 Key
    teams_data = _cached_get(f"{MLB_BASE}/teams?sportId=1")
    teams = teams_data.get('teams', [])

    home_id = _find_mlb_team_id(teams, home_team)
    away_id = _find_mlb_team_id(teams, away_team)

    if not (home_id and away_id):
        sportsdb_data = _cached_get(
            f"{SPORTSDB_BASE}/searchteams.php?t={requests.utils.quote(home_team)}"
        )
        if sportsdb_data.get('teams'):
            features['api_available'] = True
            features['api_source'] = 'thesportsdb'
        return features

    # 本季積分榜 (整季勝率)
    from datetime import datetime
    season = datetime.now().year
    standings_data = _cached_get(f"{MLB_BASE}/standings?leagueId=103,104&season={season}")
    records = standings_data.get('records', [])

    home_stats = _get_team_stats(records, home_id)
    away_stats = _get_team_stats(records, away_id)

    if home_stats:
        total = home_stats.get('wins', 0) + home_stats.get('losses', 0)
        features['home_win_rate'] = home_stats.get('wins', 0) / max(total, 1)

    if away_stats:
        total = away_stats.get('wins', 0) + away_stats.get('losses', 0)
        features['away_win_rate'] = away_stats.get('wins', 0) / max(total, 1)

    # 近期場次滾動勝率 (最近 15 場)
    home_form = _get_mlb_recent_form(home_id, n=15)
    away_form = _get_mlb_recent_form(away_id, n=15)

    if home_form is not None:
        features['home_form_score'] = round(home_form * 100, 1)
        features['home_avg_goals'] = _get_mlb_avg_runs(home_id)
    else:
        features['home_form_score'] = features['home_win_rate'] * 100

    if away_form is not None:
        features['away_form_score'] = round(away_form * 100, 1)
        features['away_avg_goals'] = _get_mlb_avg_runs(away_id)
    else:
        features['away_form_score'] = features['away_win_rate'] * 100

    features['api_available'] = True
    features['api_source'] = 'mlb-statsapi'
    return features


def _get_mlb_recent_form(team_id: int, n: int = 15) -> float | None:
    """取得 MLB 球隊近 n 場勝率"""
    from datetime import datetime, timedelta
    end = datetime.now().strftime('%Y-%m-%d')
    start = (datetime.now() - timedelta(days=60)).strftime('%Y-%m-%d')
    url = (
        f"{MLB_BASE}/schedule?sportId=1&teamId={team_id}"
        f"&startDate={start}&endDate={end}&gameType=R"
    )
    data = _cached_get(url)
    dates = data.get('dates', [])

    wins = 0
    total = 0
    for d in dates:
        for game in d.get('games', []):
            if game.get('status', {}).get('abstractGameState') != 'Final':
                continue
            teams = game.get('teams', {})
            home = teams.get('home', {})
            away = teams.get('away', {})
            is_home = home.get('team', {}).get('id') == team_id
            team_data = home if is_home else away
            if team_data.get('isWinner'):
                wins += 1
            total += 1
            if total >= n:
                break
        if total >= n:
            break

    return wins / total if total >= 5 else None


def _get_mlb_avg_runs(team_id: int) -> float:
    """取得 MLB 球隊近期場均得分"""
    from datetime import datetime, timedelta
    end = datetime.now().strftime('%Y-%m-%d')
    start = (datetime.now() - timedelta(days=45)).strftime('%Y-%m-%d')
    url = (
        f"{MLB_BASE}/schedule?sportId=1&teamId={team_id}"
        f"&startDate={start}&endDate={end}&gameType=R"
    )
    data = _cached_get(url)
    dates = data.get('dates', [])

    total_runs = 0
    game_count = 0
    for d in dates:
        for game in d.get('games', []):
            if game.get('status', {}).get('abstractGameState') != 'Final':
                continue
            teams = game.get('teams', {})
            home = teams.get('home', {})
            away = teams.get('away', {})
            is_home = home.get('team', {}).get('id') == team_id
            team_data = home if is_home else away
            runs = team_data.get('score', 0) or 0
            total_runs += runs
            game_count += 1
            if game_count >= 10:
                break
        if game_count >= 10:
            break

    return round(total_runs / game_count, 1) if game_count >= 3 else 4.3


def _find_mlb_team_id(teams: list, team_name: str) -> int | None:
    """在 MLB 球隊列表中搜尋球隊 ID"""
    name_lower = team_name.lower()
    for team in teams:
        if (name_lower in team.get('name', '').lower() or
                name_lower in team.get('teamName', '').lower() or
                name_lower in team.get('abbreviation', '').lower()):
            return team.get('id')
    return None


def _get_team_stats(records: list, team_id: int) -> dict | None:
    """從積分榜記錄中找出球隊數據"""
    for division in records:
        for team_record in division.get('teamRecords', []):
            if team_record.get('team', {}).get('id') == team_id:
                return {
                    'wins': team_record.get('wins', 0),
                    'losses': team_record.get('losses', 0),
                }
    return None


def _get_neutral_features(sport_type: str) -> dict:
    """
    API 失敗時的中性預設特徵
    系統不會因 API 失敗而崩潰
    """
    return {
        'api_available': False,
        'api_source': 'none',
        'home_win_rate': 0.50,
        'away_win_rate': 0.45,
        'home_avg_goals': 1.5 if sport_type == 'soccer' else 4.5,
        'away_avg_goals': 1.3 if sport_type == 'soccer' else 4.2,
        'home_form_score': 52.0,
        'away_form_score': 50.0,
        'head_to_head_home_wins': 0,
        'head_to_head_draws': 0,
        'head_to_head_away_wins': 0,
    }
