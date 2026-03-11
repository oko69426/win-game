"""
WINGAME AI - 真實比賽數據訓練腳本
使用 Football-Data.org API 抓取真實歷史比賽結果訓練 XGBoost 模型

執行: python train_real_data.py
預計時間: 10-15 分鐘 (API 有限速 10次/分鐘)
"""
import requests
import time
import json
import pickle
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import FOOTBALL_DATA_API_KEY, MODEL_DIR

try:
    import numpy as np
    import pandas as pd
    import xgboost as xgb
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import accuracy_score
except ImportError:
    print("請先執行: pip install xgboost scikit-learn numpy pandas")
    sys.exit(1)

# API 設定
BASE_URL = "https://api.football-data.org/v4"
HEADERS = {"X-Auth-Token": FOOTBALL_DATA_API_KEY}
RATE_LIMIT_SLEEP = 7  # 免費方案每分鐘 10 次，保守設 7 秒

# 要抓取的聯賽 (免費方案可用)
COMPETITIONS = [
    {"code": "PL",  "name": "英超"},
    {"code": "BL1", "name": "德甲"},
    {"code": "PD",  "name": "西甲"},
    {"code": "SA",  "name": "義甲"},
    {"code": "FL1", "name": "法甲"},
]

# 抓取季節 (2022-2023, 2023-2024)
SEASONS = [2022, 2023]

os.makedirs(MODEL_DIR, exist_ok=True)


def api_get(url: str) -> dict:
    """限速 GET 請求"""
    time.sleep(RATE_LIMIT_SLEEP)
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code == 429:
            print("  API 限速，等待 60 秒...")
            time.sleep(60)
            resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  API 錯誤: {e}")
        return {}


def fetch_matches(competition_code: str, season: int) -> list:
    """抓取指定聯賽和季節的所有完賽比賽"""
    url = f"{BASE_URL}/competitions/{competition_code}/matches?season={season}&status=FINISHED"
    data = api_get(url)
    matches = data.get("matches", [])
    print(f"  {competition_code} {season}賽季: {len(matches)} 場比賽")
    return matches


def build_team_stats(matches: list) -> dict:
    """
    根據比賽記錄建立每支球隊的統計數據
    返回: {team_id: {matches: [...], win_rate, avg_goals_scored, avg_goals_conceded}}
    """
    team_matches = defaultdict(list)

    for m in matches:
        home_id = m.get("homeTeam", {}).get("id")
        away_id = m.get("awayTeam", {}).get("id")
        score = m.get("score", {})
        full_time = score.get("fullTime", {})
        home_goals = full_time.get("home", 0) or 0
        away_goals = full_time.get("away", 0) or 0
        winner = score.get("winner")  # HOME_TEAM / AWAY_TEAM / DRAW
        utc_date = m.get("utcDate", "")

        if home_id and away_id and winner:
            team_matches[home_id].append({
                "date": utc_date,
                "is_home": True,
                "goals_scored": home_goals,
                "goals_conceded": away_goals,
                "result": 1 if winner == "HOME_TEAM" else (0 if winner == "DRAW" else -1)
            })
            team_matches[away_id].append({
                "date": utc_date,
                "is_home": False,
                "goals_scored": away_goals,
                "goals_conceded": home_goals,
                "result": 1 if winner == "AWAY_TEAM" else (0 if winner == "DRAW" else -1)
            })

    # 每個球隊依日期排序
    for team_id in team_matches:
        team_matches[team_id].sort(key=lambda x: x["date"])

    return team_matches


def get_team_form(team_matches: list, before_date: str, n: int = 10) -> dict:
    """
    取得某球隊在指定日期前最近 n 場比賽的狀態特徵
    """
    past = [m for m in team_matches if m["date"] < before_date]
    recent = past[-n:] if len(past) >= n else past

    if not recent:
        return {
            "win_rate": 0.45,
            "draw_rate": 0.25,
            "avg_goals_scored": 1.3,
            "avg_goals_conceded": 1.3,
            "form_points": 1.2,  # 每場平均積分
            "games_played": 0
        }

    wins = sum(1 for m in recent if m["result"] == 1)
    draws = sum(1 for m in recent if m["result"] == 0)
    total = len(recent)
    points = (wins * 3 + draws) / total  # 每場平均積分

    return {
        "win_rate": wins / total,
        "draw_rate": draws / total,
        "avg_goals_scored": sum(m["goals_scored"] for m in recent) / total,
        "avg_goals_conceded": sum(m["goals_conceded"] for m in recent) / total,
        "form_points": points,
        "games_played": total
    }


def get_h2h(all_matches: list, home_id: int, away_id: int, before_date: str) -> dict:
    """取得兩隊歷史交鋒記錄"""
    h2h = [
        m for m in all_matches
        if m.get("utcDate", "") < before_date and (
            (m.get("homeTeam", {}).get("id") == home_id and m.get("awayTeam", {}).get("id") == away_id) or
            (m.get("homeTeam", {}).get("id") == away_id and m.get("awayTeam", {}).get("id") == home_id)
        )
    ]

    if not h2h:
        return {"h2h_home_win_rate": 0.45, "h2h_draw_rate": 0.25}

    home_wins = sum(
        1 for m in h2h
        if (m.get("homeTeam", {}).get("id") == home_id and m.get("score", {}).get("winner") == "HOME_TEAM") or
           (m.get("awayTeam", {}).get("id") == home_id and m.get("score", {}).get("winner") == "AWAY_TEAM")
    )
    draws = sum(1 for m in h2h if m.get("score", {}).get("winner") == "DRAW")
    total = len(h2h)

    return {
        "h2h_home_win_rate": home_wins / total,
        "h2h_draw_rate": draws / total,
    }


def build_training_data(all_matches: list) -> tuple:
    """
    把所有比賽轉換成訓練特徵和標籤

    特徵: [home_win_rate, home_form_points, home_avg_goals_scored,
           away_win_rate, away_form_points, away_avg_goals_scored,
           h2h_home_win_rate, h2h_draw_rate,
           home_goals_conceded, away_goals_conceded,
           home_draw_rate, away_draw_rate]
    標籤: 0=主勝, 1=平, 2=客勝
    """
    # 先建立所有球隊統計
    team_stats = build_team_stats(all_matches)

    rows = []
    labels = []
    skipped = 0

    for m in all_matches:
        home_id = m.get("homeTeam", {}).get("id")
        away_id = m.get("awayTeam", {}).get("id")
        match_date = m.get("utcDate", "")
        winner = m.get("score", {}).get("winner")

        if not (home_id and away_id and winner and match_date):
            skipped += 1
            continue

        # 需要至少 5 場歷史才有意義
        home_history = [x for x in team_stats[home_id] if x["date"] < match_date]
        away_history = [x for x in team_stats[away_id] if x["date"] < match_date]

        if len(home_history) < 5 or len(away_history) < 5:
            skipped += 1
            continue

        home_form = get_team_form(team_stats[home_id], match_date)
        away_form = get_team_form(team_stats[away_id], match_date)
        h2h = get_h2h(all_matches, home_id, away_id, match_date)

        # 標籤
        if winner == "HOME_TEAM":
            label = 0
        elif winner == "DRAW":
            label = 1
        else:
            label = 2

        row = [
            home_form["win_rate"],
            home_form["form_points"],
            home_form["avg_goals_scored"],
            home_form["avg_goals_conceded"],
            home_form["draw_rate"],
            away_form["win_rate"],
            away_form["form_points"],
            away_form["avg_goals_scored"],
            away_form["avg_goals_conceded"],
            away_form["draw_rate"],
            h2h["h2h_home_win_rate"],
            h2h["h2h_draw_rate"],
        ]

        rows.append(row)
        labels.append(label)

    print(f"  有效訓練樣本: {len(rows)} 筆 (跳過: {skipped} 筆)")
    return rows, labels


def train_soccer_model(X, y) -> xgb.XGBClassifier:
    """訓練足球預測模型"""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = xgb.XGBClassifier(
        n_estimators=500,
        max_depth=4,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,
        gamma=0.1,
        reg_alpha=0.1,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )

    acc = accuracy_score(y_test, model.predict(X_test))

    # 5折交叉驗證
    cv_scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")

    print(f"\n  測試集準確率: {acc:.1%}")
    print(f"  5折交叉驗證: {cv_scores.mean():.1%} ± {cv_scores.std():.1%}")

    return model, acc


def main():
    print("=" * 55)
    print("  WINGAME AI - 真實數據模型訓練")
    print(f"  使用 Football-Data.org API")
    print("=" * 55)

    all_matches = []

    # 抓取各聯賽數據
    print("\n[1/3] 從 Football-Data.org 抓取比賽數據...")
    for comp in COMPETITIONS:
        print(f"\n  聯賽: {comp['name']} ({comp['code']})")
        for season in SEASONS:
            matches = fetch_matches(comp["code"], season)
            all_matches.extend(matches)

    print(f"\n  總計抓取: {len(all_matches)} 場比賽")

    if len(all_matches) < 200:
        print("\n  [警告] 數據量不足，可能是 API 限制。使用現有合成模型。")
        return

    # 儲存原始數據備用
    raw_path = os.path.join(os.path.dirname(__file__), "real_matches_raw.json")
    with open(raw_path, "w", encoding="utf-8") as f:
        json.dump(all_matches, f, ensure_ascii=False)
    print(f"  原始數據已儲存: {raw_path}")

    # 建立訓練特徵
    print("\n[2/3] 建立訓練特徵...")
    rows, labels = build_training_data(all_matches)

    if len(rows) < 100:
        print("  [錯誤] 有效樣本太少，無法訓練。")
        return

    X = np.array(rows)
    y = np.array(labels)

    # 標籤分佈
    unique, counts = np.unique(y, return_counts=True)
    label_names = {0: "主勝", 1: "平局", 2: "客勝"}
    print("  標籤分佈:")
    for u, c in zip(unique, counts):
        print(f"    {label_names[u]}: {c} 筆 ({c/len(y):.1%})")

    # 訓練模型
    print("\n[3/3] 訓練 XGBoost 模型...")
    model, accuracy = train_soccer_model(X, y)

    # 儲存模型
    model_path = os.path.join(MODEL_DIR, "soccer_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    # 儲存訓練元數據
    meta = {
        "total_matches": len(all_matches),
        "training_samples": len(rows),
        "accuracy": float(accuracy),
        "competitions": [c["name"] for c in COMPETITIONS],
        "seasons": SEASONS,
        "feature_columns": [
            "home_win_rate", "home_form_points", "home_avg_goals_scored",
            "home_avg_goals_conceded", "home_draw_rate",
            "away_win_rate", "away_form_points", "away_avg_goals_scored",
            "away_avg_goals_conceded", "away_draw_rate",
            "h2h_home_win_rate", "h2h_draw_rate"
        ],
        "data_source": "football-data.org (real matches)"
    }
    meta_path = os.path.join(MODEL_DIR, "soccer_model_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"\n  模型已儲存: {model_path}")
    print(f"  元數據: {meta_path}")
    print("\n" + "=" * 55)
    print(f"  訓練完成！真實數據準確率: {accuracy:.1%}")
    if accuracy >= 0.65:
        print("  結果良好，模型可用於預測")
    else:
        print("  準確率偏低，建議增加更多歷史數據")
    print("=" * 55)
    print("\n  請重啟後端讓新模型生效:")
    print("  關閉後端視窗 → 重新執行 start.bat")


if __name__ == "__main__":
    main()
