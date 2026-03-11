"""
WINGAME AI - 每日精選推薦
GET /api/daily-picks
使用 Football-Data.org 抓取今日賽事並執行 ML 預測，返回前 5 個高信心度推薦
"""
from flask import Blueprint, jsonify
import sys
import os
from datetime import datetime, timezone

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import FOOTBALL_DATA_API_KEY
from services.api_service import _get_neutral_features
from services.ml_service import predict_match

daily_picks_bp = Blueprint('daily_picks', __name__)

FOOTBALL_DATA_BASE = "https://api.football-data.org/v4"

# 監控的聯賽 (Football-Data 聯賽代碼)
COMPETITIONS = {
    'PL':  '英格蘭超級聯賽',
    'PD':  '西班牙甲級聯賽',
    'BL1': '德國甲級聯賽',
    'SA':  '義大利甲級聯賽',
    'FL1': '法國甲級聯賽',
    'CL':  'UEFA 冠軍聯賽',
    'EC':  '歐洲國家盃',
    'WC':  'FIFA 世界盃',
}


@daily_picks_bp.route('/daily-picks', methods=['GET'])
def get_daily_picks():
    """取得今日賽事精選推薦"""
    if not FOOTBALL_DATA_API_KEY:
        # 示範模式：返回假資料
        return jsonify({
            'success': True,
            'demo': True,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'message': '未設定 Football-Data API Key，顯示示範資料',
            'picks': _get_demo_picks(),
            'generated_at': datetime.now(timezone.utc).isoformat(),
        })

    today = datetime.now().strftime('%Y-%m-%d')
    headers = {'X-Auth-Token': FOOTBALL_DATA_API_KEY}

    url = f"{FOOTBALL_DATA_BASE}/matches?dateFrom={today}&dateTo={today}&status=SCHEDULED"

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.HTTPError as e:
        return jsonify({
            'success': False,
            'message': f'Football-Data API 錯誤: {e.response.status_code}',
            'picks': _get_demo_picks(),
            'demo': True,
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'API 查詢失敗: {str(e)}',
            'picks': [],
        })

    matches = data.get('matches', [])

    picks = []
    for match in matches[:30]:  # 最多處理 30 場
        competition_code = match.get('competition', {}).get('code', '')
        competition_name = COMPETITIONS.get(competition_code)
        if not competition_name:
            continue

        home_team = match.get('homeTeam', {}).get('name', '')
        away_team = match.get('awayTeam', {}).get('name', '')
        match_time_utc = match.get('utcDate', '')

        if not home_team or not away_team:
            continue

        # 使用中性基準數據執行預測
        api_data = _get_neutral_features('soccer')
        ocr_data = {'odds': {}}
        prediction = predict_match(ocr_data, api_data, 'soccer')

        winner = prediction.get('winner', {})
        home_win = winner.get('home_win', 0)
        draw_p = winner.get('draw', 0)
        away_win = winner.get('away_win', 0)
        max_prob = max(home_win, draw_p, away_win)

        # 只收錄信心度 ≥ 50 的場次
        if max_prob < 50:
            continue

        picks.append({
            'match_id': match.get('id'),
            'competition': competition_name,
            'competition_code': competition_code,
            'home_team': home_team,
            'away_team': away_team,
            'match_time': match_time_utc,
            'prediction': {
                'winner': winner,
                'recommended': prediction.get('recommended'),
                'over_under': prediction.get('over_under'),
                'handicap': prediction.get('handicap'),
                'confidence_level': prediction.get('confidence_level'),
                'tier_label': prediction.get('tier_label'),
            },
            'confidence_score': round(max_prob, 1),
        })

    # 按信心度排序，取前 5
    picks.sort(key=lambda x: x['confidence_score'], reverse=True)

    return jsonify({
        'success': True,
        'demo': False,
        'date': today,
        'total_matches': len(matches),
        'picks': picks[:5],
        'generated_at': datetime.now(timezone.utc).isoformat(),
    })


def _get_demo_picks():
    """API Key 未設定時的示範資料"""
    return [
        {
            'match_id': 9001,
            'competition': '英格蘭超級聯賽',
            'competition_code': 'PL',
            'home_team': 'Manchester City',
            'away_team': 'Arsenal',
            'match_time': datetime.now(timezone.utc).strftime('%Y-%m-%dT20:00:00Z'),
            'prediction': {
                'winner': {'home_win': 52.0, 'draw': 24.0, 'away_win': 24.0},
                'recommended': '主隊勝',
                'over_under': {'over': 58.0, 'under': 42.0, 'line': '2.5 球',
                               'recommendation': '大 (Over 2.5 球)'},
                'handicap': {'line': -0.5, 'display': '主隊 -0.5 球',
                             'recommendation': '主隊讓半球', 'side': 'home',
                             'reason': '主隊略佔優勢'},
                'confidence_level': '中',
                'tier_label': '示範模式',
            },
            'confidence_score': 52.0,
        },
        {
            'match_id': 9002,
            'competition': '西班牙甲級聯賽',
            'competition_code': 'PD',
            'home_team': 'Real Madrid',
            'away_team': 'FC Barcelona',
            'match_time': datetime.now(timezone.utc).strftime('%Y-%m-%dT21:00:00Z'),
            'prediction': {
                'winner': {'home_win': 55.0, 'draw': 22.0, 'away_win': 23.0},
                'recommended': '主隊勝',
                'over_under': {'over': 62.0, 'under': 38.0, 'line': '2.5 球',
                               'recommendation': '大 (Over 2.5 球)'},
                'handicap': {'line': -0.5, 'display': '主隊 -0.5 球',
                             'recommendation': '主隊讓半球', 'side': 'home',
                             'reason': '主隊略佔優勢'},
                'confidence_level': '中',
                'tier_label': '示範模式',
            },
            'confidence_score': 55.0,
        },
        {
            'match_id': 9003,
            'competition': '德國甲級聯賽',
            'competition_code': 'BL1',
            'home_team': 'Bayern Munich',
            'away_team': 'Borussia Dortmund',
            'match_time': datetime.now(timezone.utc).strftime('%Y-%m-%dT17:30:00Z'),
            'prediction': {
                'winner': {'home_win': 60.0, 'draw': 20.0, 'away_win': 20.0},
                'recommended': '主隊勝',
                'over_under': {'over': 65.0, 'under': 35.0, 'line': '2.5 球',
                               'recommendation': '大 (Over 2.5 球)'},
                'handicap': {'line': -1.0, 'display': '主隊 -1 球',
                             'recommendation': '主隊讓1球', 'side': 'home',
                             'reason': '主隊勝率顯著較高'},
                'confidence_level': '中',
                'tier_label': '示範模式',
            },
            'confidence_score': 60.0,
        },
    ]
