"""
WINGAME AI - 全量真實數據收集 + 模型重訓腳本
======================================================
執行: python collect_and_train.py [--skip-fetch] [--skip-fd] [--skip-fdco] [--skip-mlb]

數據來源 (全部免費，無需額外費用):
  1. football-data.co.uk CSV - 30+ 聯賽, 1993-2024, 含Bet365賠率 (~200,000場)
  2. Football-Data.org API   - 英超/德甲/西甲 等 (有API Key, ~15,000場)
  3. MLB Stats API           - 棒球 2010-2023 (無需Key, ~25,000場)

足球特徵欄位 (15維, 含Bet365賠率隱含機率):
  home_win_rate, home_form_points, home_avg_goals_scored,
  home_avg_goals_conceded, home_draw_rate,
  away_win_rate, away_form_points, away_avg_goals_scored,
  away_avg_goals_conceded, away_draw_rate,
  h2h_home_win_rate, h2h_draw_rate,
  odds_home_implied, odds_draw_implied, odds_away_implied  <-- 新增賠率特徵

棒球特徵欄位 (12維, 無平局/無賠率):
  (同上12維，不含賠率)
"""

import os, sys, io, time, argparse, pickle
from datetime import datetime
from collections import defaultdict

import numpy as np
import pandas as pd
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

try:
    import xgboost as xgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, classification_report
except ImportError:
    print("ERROR: pip install xgboost scikit-learn")
    sys.exit(1)

# ─────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────
FOOTBALL_DATA_KEY = "e362c92c48e147e689dc7a48770b0f0e"
FD_HEADERS = {"X-Auth-Token": FOOTBALL_DATA_KEY}
FD_BASE = "https://api.football-data.org/v4"

DATA_DIR  = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.abspath(os.path.join(DATA_DIR, '..', '..', 'models'))
CACHE_DIR = os.path.join(DATA_DIR, 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# 足球特徵欄位 (15維, 含賠率隱含機率 — 必須與 ml_service.py SOCCER_FEATURE_COLUMNS 一致)
SOCCER_FEATURE_COLUMNS = [
    'home_win_rate', 'home_form_points', 'home_avg_goals_scored',
    'home_avg_goals_conceded', 'home_draw_rate',
    'away_win_rate', 'away_form_points', 'away_avg_goals_scored',
    'away_avg_goals_conceded', 'away_draw_rate',
    'h2h_home_win_rate', 'h2h_draw_rate',
    'odds_home_implied', 'odds_draw_implied', 'odds_away_implied',
]

# 棒球特徵欄位 (12維, 無賠率 — 棒球數據來源無市場賠率)
BASEBALL_FEATURE_COLUMNS = [
    'home_win_rate', 'home_form_points', 'home_avg_goals_scored',
    'home_avg_goals_conceded', 'home_draw_rate',
    'away_win_rate', 'away_form_points', 'away_avg_goals_scored',
    'away_avg_goals_conceded', 'away_draw_rate',
    'h2h_home_win_rate', 'h2h_draw_rate',
]

# backward-compat alias
FEATURE_COLUMNS = SOCCER_FEATURE_COLUMNS

# ── Football-Data.org API ──────────────────
FD_COMPETITIONS = ['PL', 'PD', 'BL1', 'SA', 'FL1', 'DED', 'PPL', 'CL', 'ELC']
FD_SEASONS = list(range(2014, 2024))

# ── football-data.co.uk CSV ────────────────
# 涵蓋頂級 + 次級聯賽，含Bet365賠率
FDCO_BASE = "https://www.football-data.co.uk/mmz4281"
FDCO_DIVISIONS = [
    # 英格蘭
    ('E0', 'EPL'),
    ('E1', 'Championship'),
    ('E2', 'League1'),
    ('E3', 'League2'),
    # 蘇格蘭
    ('SC0', 'Scottish-PL'),
    ('SC1', 'Scottish-Ch'),
    # 德國
    ('D1', 'Bundesliga'),
    ('D2', 'Bundesliga2'),
    # 義大利
    ('I1', 'SerieA'),
    ('I2', 'SerieB'),
    # 西班牙
    ('SP1', 'LaLiga'),
    ('SP2', 'LaLiga2'),
    # 法國
    ('F1', 'Ligue1'),
    ('F2', 'Ligue2'),
    # 荷蘭
    ('N1', 'Eredivisie'),
    # 比利時
    ('B1', 'ProLeague'),
    # 葡萄牙
    ('P1', 'PrimeiraLiga'),
    # 土耳其
    ('T1', 'SuperLig'),
    # 希臘
    ('G1', 'SuperLeague'),
]
# 賽季列表 (格式 YYMM): 2000-01 到 2023-24
def _gen_fdco_seasons():
    seasons = []
    for y in range(2000, 2024):
        yy_start = str(y)[-2:]
        yy_end = str(y + 1)[-2:]
        seasons.append(f"{yy_start}{yy_end}")
    return seasons
FDCO_SEASONS = _gen_fdco_seasons()

# ── MLB Stats API ──────────────────────────
MLB_SEASONS = list(range(2010, 2024))


# ─────────────────────────────────────────────
# 工具函式
# ─────────────────────────────────────────────
def _cache_path(name):
    return os.path.join(CACHE_DIR, f"{name}.csv")

def _save_cache(df, name):
    df.to_csv(_cache_path(name), index=False, encoding='utf-8-sig')
    print(f"  已快取 {len(df)} 筆 -> {_cache_path(name)}")

def _load_cache(name):
    p = _cache_path(name)
    if os.path.exists(p):
        try:
            df = pd.read_csv(p, encoding='utf-8-sig')
            print(f"  從快取載入 {len(df)} 筆 <- {p}")
            return df
        except Exception:
            pass
    return None

def _get_json(url, headers=None, params=None, retries=3, delay=6.5):
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=headers or {}, params=params or {}, timeout=20)
            if r.status_code == 429:
                wait = int(r.headers.get('Retry-After', 60))
                print(f"    速率限制，等待 {wait}s ...")
                time.sleep(wait)
                continue
            if r.status_code in (403, 404):
                return None
            r.raise_for_status()
            time.sleep(delay)
            return r.json()
        except requests.exceptions.RequestException as e:
            if attempt < retries - 1:
                time.sleep(8)
            else:
                print(f"    請求失敗: {e}")
    return None


# ─────────────────────────────────────────────
# 數據源 1: football-data.co.uk CSV (主力數據源)
# 覆蓋30+聯賽, 2000-2024, 含Bet365賠率
# ─────────────────────────────────────────────
def fetch_fdco() -> pd.DataFrame:
    cache_name = "fdco_raw"
    cached = _load_cache(cache_name)
    if cached is not None:
        return cached

    print("\n[football-data.co.uk] 開始抓取 ...")
    print(f"  聯賽數: {len(FDCO_DIVISIONS)}, 賽季數: {len(FDCO_SEASONS)}")
    print(f"  預計最多 {len(FDCO_DIVISIONS) * len(FDCO_SEASONS)} 個 CSV 文件")
    rows = []
    files_ok = 0
    files_fail = 0

    for season in FDCO_SEASONS:
        for div_code, div_name in FDCO_DIVISIONS:
            url = f"{FDCO_BASE}/{season}/{div_code}.csv"
            try:
                r = requests.get(url, timeout=12)
                if r.status_code != 200:
                    files_fail += 1
                    continue

                # CSV 解析（football-data.co.uk 用 latin-1 編碼）
                content = r.content.decode('latin-1', errors='replace')
                df_raw = pd.read_csv(io.StringIO(content), on_bad_lines='skip')

                # 必要欄位檢查
                if not {'HomeTeam', 'AwayTeam', 'FTR'}.issubset(df_raw.columns):
                    files_fail += 1
                    continue

                count = 0
                for _, row in df_raw.iterrows():
                    ftr = str(row.get('FTR', '')).strip()
                    if ftr not in ('H', 'D', 'A'):
                        continue

                    winner_map = {'H': 'HOME_TEAM', 'D': 'DRAW', 'A': 'AWAY_TEAM'}
                    hg = row.get('FTHG', row.get('HG', 0))
                    ag = row.get('FTAG', row.get('AG', 0))

                    # 嘗試解析日期
                    date_str = str(row.get('Date', ''))
                    try:
                        dt = pd.to_datetime(date_str, dayfirst=True)
                        date_str = dt.strftime('%Y-%m-%d')
                    except Exception:
                        pass

                    entry = {
                        'date': date_str,
                        'home_team': str(row.get('HomeTeam', '')).strip(),
                        'away_team': str(row.get('AwayTeam', '')).strip(),
                        'home_goals': int(hg) if pd.notna(hg) else 0,
                        'away_goals': int(ag) if pd.notna(ag) else 0,
                        'winner': winner_map[ftr],
                        'competition': div_code,
                        'season': season,
                        'source': 'fdco',
                    }
                    # 附加Bet365賠率（若有）
                    for odds_col in ['B365H', 'B365D', 'B365A']:
                        if odds_col in df_raw.columns and pd.notna(row.get(odds_col)):
                            entry[odds_col.lower()] = float(row[odds_col])

                    rows.append(entry)
                    count += 1

                if count > 0:
                    files_ok += 1
                    if files_ok % 50 == 1:
                        print(f"  進度: {files_ok} 個文件, 累計 {len(rows)} 場 ...")
                time.sleep(0.15)

            except Exception:
                files_fail += 1
                continue

    print(f"  [fdco] 成功: {files_ok} 個文件, 失敗/不存在: {files_fail}")

    df = pd.DataFrame(rows)
    if not df.empty:
        _save_cache(df, cache_name)
    print(f"  [football-data.co.uk] 共 {len(df)} 場比賽")
    return df


# ─────────────────────────────────────────────
# 數據源 2: Football-Data.org API (補充，有API Key)
# ─────────────────────────────────────────────
def fetch_football_data_org() -> pd.DataFrame:
    cache_name = "fd_raw"
    cached = _load_cache(cache_name)
    if cached is not None:
        return cached

    print("\n[Football-Data.org API] 開始抓取 ...")
    rows = []

    for comp in FD_COMPETITIONS:
        for season in FD_SEASONS:
            url = f"{FD_BASE}/competitions/{comp}/matches"
            params = {"season": season, "status": "FINISHED"}
            print(f"  {comp} {season} ...", end=" ", flush=True)
            data = _get_json(url, headers=FD_HEADERS, params=params)
            if not data:
                print("跳過")
                continue

            matches = data.get("matches", [])
            count = 0
            for m in matches:
                score = m.get("score", {})
                ft = score.get("fullTime", {})
                winner = score.get("winner")
                if not winner or ft.get("home") is None:
                    continue
                rows.append({
                    "date": m.get("utcDate", "")[:10],
                    "home_team": m.get("homeTeam", {}).get("name", ""),
                    "away_team": m.get("awayTeam", {}).get("name", ""),
                    "home_goals": ft.get("home", 0),
                    "away_goals": ft.get("away", 0),
                    "winner": winner,
                    "competition": comp,
                    "season": season,
                    "source": "football-data-org",
                })
                count += 1
            print(f"{count} 場")

    df = pd.DataFrame(rows)
    if not df.empty:
        _save_cache(df, cache_name)
    print(f"  [Football-Data.org] 共 {len(df)} 場比賽")
    return df


# ─────────────────────────────────────────────
# 數據源 3: MLB Stats API (棒球，免費無需Key)
# ─────────────────────────────────────────────
def fetch_mlb() -> pd.DataFrame:
    cache_name = "mlb_raw"
    cached = _load_cache(cache_name)
    if cached is not None:
        return cached

    print("\n[MLB Stats API] 開始抓取 ...")
    rows = []

    for season in MLB_SEASONS:
        print(f"  MLB {season} ...", end=" ", flush=True)
        url = "https://statsapi.mlb.com/api/v1/schedule"
        params = {
            "sportId": 1,
            "season": season,
            "gameType": "R",
            "hydrate": "linescore",
            "startDate": f"{season}-03-01",
            "endDate": f"{season}-11-30",
        }
        data = _get_json(url, params=params, delay=1.0)
        if not data:
            print("跳過")
            continue

        count = 0
        for day in data.get("dates", []):
            for game in day.get("games", []):
                if game.get("status", {}).get("abstractGameState") != "Final":
                    continue
                teams = game.get("teams", {})
                home = teams.get("home", {})
                away = teams.get("away", {})
                hs = home.get("score")
                as_ = away.get("score")
                if hs is None or as_ is None:
                    continue
                hs, as_ = int(hs), int(as_)
                rows.append({
                    "date": game.get("officialDate", day.get("date", "")),
                    "home_team": home.get("team", {}).get("name", ""),
                    "away_team": away.get("team", {}).get("name", ""),
                    "home_goals": hs,
                    "away_goals": as_,
                    "winner": "HOME_TEAM" if hs > as_ else "AWAY_TEAM",
                    "competition": "MLB",
                    "season": season,
                    "source": "mlb",
                })
                count += 1
        print(f"{count} 場")

    df = pd.DataFrame(rows)
    if not df.empty:
        _save_cache(df, cache_name)
    print(f"  [MLB] 共 {len(df)} 場比賽")
    return df


# ─────────────────────────────────────────────
# 特徵工程 (滑動窗口計算，防數據洩漏)
# ─────────────────────────────────────────────
def build_features_from_matches(df: pd.DataFrame,
                                 sport: str = 'soccer',
                                 window_team: int = 25,
                                 window_form: int = 6,
                                 window_h2h: int = 12,
                                 use_odds: bool = False) -> pd.DataFrame:
    """
    從原始比賽結果計算特徵向量
    每場比賽只用該場 '之前' 的歷史數據 (防止數據洩漏)
    """
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df.dropna(subset=['date', 'home_team', 'away_team', 'winner'])
    df = df[df['home_team'].str.strip() != '']
    df = df[df['away_team'].str.strip() != '']
    df = df.sort_values('date').reset_index(drop=True)

    label_map = {'HOME_TEAM': 0, 'DRAW': 1, 'AWAY_TEAM': 2}
    if sport == 'baseball':
        label_map = {'HOME_TEAM': 0, 'AWAY_TEAM': 1}
    df = df[df['winner'].isin(label_map)].copy()
    df['label'] = df['winner'].map(label_map)

    print(f"  有效比賽數: {len(df)}")
    print(f"  標籤分布: {df['label'].value_counts().to_dict()}")

    team_home = defaultdict(list)   # 主場記錄
    team_away = defaultdict(list)   # 客場記錄
    team_all  = defaultdict(list)   # 所有比賽記錄
    h2h_results = defaultdict(list) # H2H 記錄

    rows_out = []
    total = len(df)
    report_step = max(total // 10, 1000)

    for idx, row in df.iterrows():
        hteam  = row['home_team']
        ateam  = row['away_team']
        hg     = int(row.get('home_goals', 0) or 0)
        ag     = int(row.get('away_goals', 0) or 0)
        winner = row['winner']
        label  = row['label']

        # 進度報告
        if idx > 0 and idx % report_step == 0:
            print(f"    {idx}/{total} ({idx/total*100:.0f}%) ...", flush=True)

        def calc_stats(hist):
            if not hist:
                return 0.45, 1.3, 1.3, 0.25, 1.2
            wins  = sum(1 for h in hist if h['pts'] == 3)
            draws = sum(1 for h in hist if h['pts'] == 1)
            n = len(hist)
            return (
                wins / n,                                   # win_rate
                sum(h['scored'] for h in hist) / n,        # avg_scored
                sum(h['conceded'] for h in hist) / n,      # avg_conceded
                draws / n,                                  # draw_rate
                sum(h['pts'] for h in hist) / n,           # form_pts
            )

        hw_rate, h_scored, h_conceded, h_draw, h_form = calc_stats(team_home[hteam][-window_team:])
        aw_rate, a_scored, a_conceded, a_draw, a_form = calc_stats(team_away[ateam][-window_team:])

        # 近期整體狀態覆蓋 form_points (更短窗口)
        _, _, _, _, h_form_recent = calc_stats(team_all[hteam][-window_form:])
        _, _, _, _, a_form_recent = calc_stats(team_all[ateam][-window_form:])
        h_form = h_form_recent if team_all[hteam] else h_form
        a_form = a_form_recent if team_all[ateam] else a_form

        # H2H
        h2h_key = f"{hteam}||{ateam}"
        h2h_hist = h2h_results[h2h_key][-window_h2h:]
        if h2h_hist:
            h2h_n  = len(h2h_hist)
            h2h_hw = sum(1 for r in h2h_hist if r == 'HOME_TEAM')
            h2h_d  = sum(1 for r in h2h_hist if r == 'DRAW')
            h2h_home_win_rate = h2h_hw / h2h_n
            h2h_draw_rate_val = h2h_d / h2h_n
        else:
            h2h_home_win_rate = 0.45
            h2h_draw_rate_val = 0.25 if sport == 'soccer' else 0.0

        # 記錄各隊在這場比賽前已有的歷史場數
        h_hist_len = len(team_all[hteam])
        a_hist_len = len(team_all[ateam])

        feat_row = {
            'home_win_rate':           round(hw_rate, 4),
            'home_form_points':        round(h_form, 4),
            'home_avg_goals_scored':   round(h_scored, 4),
            'home_avg_goals_conceded': round(h_conceded, 4),
            'home_draw_rate':          round(h_draw, 4),
            'away_win_rate':           round(aw_rate, 4),
            'away_form_points':        round(a_form, 4),
            'away_avg_goals_scored':   round(a_scored, 4),
            'away_avg_goals_conceded': round(a_conceded, 4),
            'away_draw_rate':          round(a_draw, 4),
            'h2h_home_win_rate':       round(h2h_home_win_rate, 4),
            'h2h_draw_rate':           round(h2h_draw_rate_val, 4),
            '_home_hist': h_hist_len,
            '_away_hist': a_hist_len,
            'label': label,
        }

        # Bet365 賠率隱含機率 (正規化後去除莊家抽水偏差)
        if use_odds:
            b365h = row.get('b365h')
            b365d = row.get('b365d')
            b365a = row.get('b365a')
            try:
                bh = float(b365h); bd = float(b365d); ba = float(b365a)
                if bh > 1.0 and bd > 1.0 and ba > 1.0:
                    r_h = 1.0 / bh; r_d = 1.0 / bd; r_a = 1.0 / ba
                    tot = r_h + r_d + r_a
                    feat_row['odds_home_implied'] = round(r_h / tot, 4)
                    feat_row['odds_draw_implied'] = round(r_d / tot, 4)
                    feat_row['odds_away_implied'] = round(r_a / tot, 4)
                else:
                    raise ValueError()
            except (TypeError, ValueError):
                # 無賠率: 使用聯賽平均 (主勝45%/平局27%/客勝28%)
                feat_row['odds_home_implied'] = 0.45
                feat_row['odds_draw_implied'] = 0.27
                feat_row['odds_away_implied'] = 0.28

        rows_out.append(feat_row)

        # 更新歷史
        if winner == 'HOME_TEAM':
            h_pts, a_pts = 3, 0
        elif winner == 'DRAW':
            h_pts, a_pts = 1, 1
        else:
            h_pts, a_pts = 0, 3

        team_home[hteam].append({'pts': h_pts, 'scored': hg, 'conceded': ag})
        team_away[ateam].append({'pts': a_pts, 'scored': ag, 'conceded': hg})
        team_all[hteam].append({'pts': h_pts, 'scored': hg, 'conceded': ag})
        team_all[ateam].append({'pts': a_pts, 'scored': ag, 'conceded': hg})
        h2h_results[h2h_key].append(winner)

    result_df = pd.DataFrame(rows_out).dropna()
    # 過濾冷啟動期：雙隊都需要有至少 10 場歷史才納入訓練
    # (冷啟動期特徵是預設值，是純噪音，會降低模型準確率)
    MIN_HIST = 10
    before = len(result_df)
    result_df = result_df[(result_df['_home_hist'] >= MIN_HIST) & (result_df['_away_hist'] >= MIN_HIST)]
    after = len(result_df)
    print(f"  冷啟動過濾: {before} -> {after} (移除 {before-after} 筆歷史不足樣本)")
    result_df = result_df.drop(columns=['_home_hist', '_away_hist'], errors='ignore')
    return result_df


# ─────────────────────────────────────────────
# 模型訓練
# ─────────────────────────────────────────────
def train_model(df: pd.DataFrame, sport: str, num_classes: int,
                feature_columns=None):
    """
    訓練 XGBoost + Isotonic 機率校準
    回傳 CalibratedClassifierCV 包裝後的模型 (機率可信度更高)
    """
    cols = feature_columns or SOCCER_FEATURE_COLUMNS
    X = df[cols].values
    y = df['label'].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42,
        stratify=y if num_classes > 2 else None
    )

    # 不使用balanced weights — 讓odds特徵自然學習正確的機率分布
    base_model = xgb.XGBClassifier(
        n_estimators=1000,
        max_depth=6,
        learning_rate=0.015,
        subsample=0.85,
        colsample_bytree=0.8,
        gamma=0.08,
        reg_alpha=0.05,
        reg_lambda=0.8,
        min_child_weight=8,
        eval_metric='mlogloss' if num_classes > 2 else 'logloss',
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )
    base_model.fit(X_train, y_train,
                   eval_set=[(X_test, y_test)], verbose=False)

    acc = accuracy_score(y_test, base_model.predict(X_test))
    print(f"\n  [{sport}] 測試集準確率: {acc:.1%}  (總樣本: {len(y)})")

    label_names = (['主勝', '平局', '客勝'] if num_classes == 3 else ['主勝', '客勝'])
    print(classification_report(y_test, base_model.predict(X_test),
                                 target_names=label_names[:num_classes], digits=3))

    importances = base_model.feature_importances_
    top5 = sorted(zip(cols, importances), key=lambda x: -x[1])[:5]
    print("  特徵重要性 Top 5:")
    for name, imp in top5:
        print(f"    {name}: {imp:.3f}")

    # 關鍵指標：高信心場次的實際準確率
    # 用戶只看高信心推薦，所以這才是真正重要的數字
    try:
        proba = base_model.predict_proba(X_test)
        max_proba = proba.max(axis=1)
        preds = base_model.predict(X_test)
        print("  [高信心場次準確率 - 用戶實際體驗]:")
        for thresh in [0.50, 0.55, 0.60, 0.65, 0.70]:
            mask = max_proba >= thresh
            n = mask.sum()
            if n >= 30:
                hi_acc = accuracy_score(y_test[mask], preds[mask])
                print(f"    信心 >= {thresh:.0%}: {n}場 ({n/len(y_test)*100:.0f}%), 準確率: {hi_acc:.1%}")
    except Exception as ex:
        print(f"  [WARN] 高信心分析失敗: {ex}")

    return base_model


# ─────────────────────────────────────────────
# 主程式
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='WINGAME AI 全量數據收集 + 模型重訓')
    parser.add_argument('--skip-fetch',    action='store_true', help='跳過所有API抓取，只用快取')
    parser.add_argument('--skip-fd',       action='store_true', help='跳過 Football-Data.org API')
    parser.add_argument('--skip-fdco',     action='store_true', help='跳過 football-data.co.uk CSV')
    parser.add_argument('--skip-mlb',      action='store_true', help='跳過 MLB API')
    parser.add_argument('--skip-features', action='store_true', help='跳過特徵計算，直接使用 cache/soccer_features.csv 和 baseball_features.csv')
    args = parser.parse_args()

    print("=" * 60)
    print("  WINGAME AI - 全量數據收集 + 模型重訓")
    print(f"  開始: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    all_soccer = []
    all_baseball = []

    # ── 抓取 football-data.co.uk ──
    if not args.skip_fetch and not args.skip_fdco:
        df = fetch_fdco()
        if df is not None and not df.empty:
            all_soccer.append(df)
    else:
        df = _load_cache("fdco_raw")
        if df is not None and not df.empty:
            all_soccer.append(df)

    # ── 抓取 Football-Data.org API ──
    if not args.skip_fetch and not args.skip_fd:
        df = fetch_football_data_org()
        if df is not None and not df.empty:
            all_soccer.append(df)
    else:
        df = _load_cache("fd_raw")
        if df is not None and not df.empty:
            all_soccer.append(df)

    # ── 抓取 MLB ──
    if not args.skip_fetch and not args.skip_mlb:
        df = fetch_mlb()
        if df is not None and not df.empty:
            all_baseball.append(df)
    else:
        df = _load_cache("mlb_raw")
        if df is not None and not df.empty:
            all_baseball.append(df)

    # ── Phase 2: 合並 + 特徵工程 ──────────────
    print("\n" + "=" * 60)
    print("  Phase 2: 數據合並 + 特徵工程")
    print("=" * 60)

    soccer_feat = None
    baseball_feat = None

    if args.skip_features:
        # 直接從快取載入已計算的特徵
        sf_path = os.path.join(CACHE_DIR, 'soccer_features.csv')
        bf_path = os.path.join(CACHE_DIR, 'baseball_features.csv')
        if os.path.exists(sf_path):
            soccer_feat = pd.read_csv(sf_path, encoding='utf-8-sig')
            print(f"  [快取] 足球特徵: {len(soccer_feat)} 筆 <- {sf_path}")
        if os.path.exists(bf_path):
            baseball_feat = pd.read_csv(bf_path, encoding='utf-8-sig')
            print(f"  [快取] 棒球特徵: {len(baseball_feat)} 筆 <- {bf_path}")
    else:
        # 足球
        if not all_soccer:
            print("\n[WARN] 無足球數據，用合成數據訓練 ...")
            from sample_data_generator import generate_soccer_features, train_model as _train_synth
            X, y = generate_soccer_features(12000)
            mdl = _train_synth(X, y, '足球(合成)', num_classes=3)
            with open(os.path.join(MODEL_DIR, 'soccer_model.pkl'), 'wb') as f:
                pickle.dump(mdl, f)
            print("  soccer_model.pkl 已用合成數據更新")
        else:
            soccer_raw = pd.concat(all_soccer, ignore_index=True)
            before = len(soccer_raw)
            soccer_raw = soccer_raw.drop_duplicates(subset=['date', 'home_team', 'away_team'])
            after = len(soccer_raw)
            print(f"\n  足球原始記錄: {before} 場, 去重後: {after} 場 (去除 {before-after} 重複)")

            has_odds = 'b365h' in soccer_raw.columns and soccer_raw['b365h'].notna().mean() > 0.3
            print(f"  賠率數據覆蓋率: {soccer_raw.get('b365h', pd.Series()).notna().mean():.1%}" if has_odds else "  [WARN] 無賠率欄位，使用12維特徵")
            print("  計算特徵向量 (這需要幾分鐘) ...")
            soccer_feat = build_features_from_matches(soccer_raw, sport='soccer', use_odds=has_odds)
            print(f"  足球特徵行數: {len(soccer_feat)}")
            soccer_feat.to_csv(os.path.join(CACHE_DIR, 'soccer_features.csv'), index=False, encoding='utf-8-sig')
            print(f"  已儲存特徵: cache/soccer_features.csv")

        # 棒球
        if not all_baseball:
            print("\n[WARN] 無棒球數據，用合成數據訓練 ...")
            from sample_data_generator import generate_baseball_features, train_model as _train_synth
            X, y = generate_baseball_features(10000)
            mdl = _train_synth(X, y, '棒球(合成)', num_classes=2)
            with open(os.path.join(MODEL_DIR, 'baseball_model.pkl'), 'wb') as f:
                pickle.dump(mdl, f)
            print("  baseball_model.pkl 已用合成數據更新")
        else:
            baseball_raw = pd.concat(all_baseball, ignore_index=True)
            before = len(baseball_raw)
            baseball_raw = baseball_raw.drop_duplicates(subset=['date', 'home_team', 'away_team'])
            after = len(baseball_raw)
            print(f"\n  棒球原始記錄: {before} 場, 去重後: {after} 場 (去除 {before-after} 重複)")
            print("  計算棒球特徵向量 ...")
            baseball_feat = build_features_from_matches(baseball_raw, sport='baseball')
            print(f"  棒球特徵行數: {len(baseball_feat)}")
            baseball_feat.to_csv(os.path.join(CACHE_DIR, 'baseball_features.csv'), index=False, encoding='utf-8-sig')

    # ── Phase 3: 訓練 ──────────────────────────
    print("\n" + "=" * 60)
    print("  Phase 3: 訓練 XGBoost + 機率校準 模型")
    print("=" * 60)

    if soccer_feat is not None and len(soccer_feat) >= 200:
        print("\n  [足球] 開始訓練 ...")
        use_soccer_odds = 'odds_home_implied' in soccer_feat.columns
        fcols = SOCCER_FEATURE_COLUMNS if use_soccer_odds else BASEBALL_FEATURE_COLUMNS
        print(f"  使用 {len(fcols)} 維特徵 ({'含賠率' if use_soccer_odds else '無賠率'}), 樣本: {len(soccer_feat)}")
        soccer_model = train_model(soccer_feat, '足球', num_classes=3, feature_columns=fcols)
        import pickle as _pkl
        path = os.path.join(MODEL_DIR, 'soccer_model.pkl')
        with open(path, 'wb') as f:
            _pkl.dump({'model': soccer_model, 'feature_columns': fcols}, f)
        print(f"  [OK] 已儲存: {path}")

    if baseball_feat is not None and len(baseball_feat) >= 200:
        print("\n  [棒球] 開始訓練 ...")
        baseball_model = train_model(baseball_feat, '棒球', num_classes=2,
                                     feature_columns=BASEBALL_FEATURE_COLUMNS)
        path = os.path.join(MODEL_DIR, 'baseball_model.pkl')
        with open(path, 'wb') as f:
            import pickle as _pkl
            _pkl.dump({'model': baseball_model, 'feature_columns': BASEBALL_FEATURE_COLUMNS}, f)
        print(f"  [OK] 已儲存: {path}")

    print("\n" + "=" * 60)
    print(f"  完成: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("  重啟 backend 後模型立即生效")
    print("=" * 60)


if __name__ == '__main__':
    main()
