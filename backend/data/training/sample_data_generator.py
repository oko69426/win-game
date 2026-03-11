"""
WINGAME AI - 合成訓練資料生成器 + 模型訓練腳本
執行指令: python sample_data_generator.py

足球特徵欄位 (15維, 含賠率隱含機率):
  home_win_rate, home_form_points, home_avg_goals_scored,
  home_avg_goals_conceded, home_draw_rate,
  away_win_rate, away_form_points, away_avg_goals_scored,
  away_avg_goals_conceded, away_draw_rate,
  h2h_home_win_rate, h2h_draw_rate,
  odds_home_implied, odds_draw_implied, odds_away_implied

棒球特徵欄位 (12維, 無賠率)

若要使用真實數據提升準確率，請執行:
  python collect_and_train.py
"""
import numpy as np
import pandas as pd
import pickle
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

try:
    import xgboost as xgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score
    HAS_SKLEARN = True
except ImportError:
    print("錯誤: 請先安裝 xgboost 和 scikit-learn")
    print("執行: pip install xgboost scikit-learn numpy pandas")
    sys.exit(1)

np.random.seed(42)
N_SAMPLES = 10000

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'models')
MODEL_DIR = os.path.abspath(MODEL_DIR)

# 足球特徵欄位 (15維, 含賠率 — 必須與 ml_service.py SOCCER_FEATURE_COLUMNS 完全一致)
SOCCER_FEATURE_COLUMNS = [
    'home_win_rate',
    'home_form_points',
    'home_avg_goals_scored',
    'home_avg_goals_conceded',
    'home_draw_rate',
    'away_win_rate',
    'away_form_points',
    'away_avg_goals_scored',
    'away_avg_goals_conceded',
    'away_draw_rate',
    'h2h_home_win_rate',
    'h2h_draw_rate',
    'odds_home_implied',
    'odds_draw_implied',
    'odds_away_implied',
]

# 棒球特徵欄位 (12維, 無賠率)
BASEBALL_FEATURE_COLUMNS = [
    'home_win_rate',
    'home_form_points',
    'home_avg_goals_scored',
    'home_avg_goals_conceded',
    'home_draw_rate',
    'away_win_rate',
    'away_form_points',
    'away_avg_goals_scored',
    'away_avg_goals_conceded',
    'away_draw_rate',
    'h2h_home_win_rate',
    'h2h_draw_rate',
]

# backward-compat alias
FEATURE_COLUMNS = SOCCER_FEATURE_COLUMNS


def generate_soccer_features(n: int) -> tuple:
    """
    生成足球預測特徵與標籤
    歐洲足球統計: 主場勝 ~46%, 平局 ~26%, 客場勝 ~28%

    特徵單位說明:
      win_rate     : 0.0~1.0 (勝率)
      form_points  : 0.0~3.0 (每場平均積分: 勝3/平1/負0)
      avg_goals    : 0.0~3.5 (每場平均進/失球)
      draw_rate    : 0.0~1.0 (平局率)
      h2h_*        : 0.0~1.0
    """
    n = int(n)

    # 歷史勝率 (主隊主場偏高)
    home_win_rate = np.random.beta(3, 2, n).clip(0.05, 0.95)
    away_win_rate = np.random.beta(2, 3, n).clip(0.05, 0.90)

    # 近期積分 (每場 0-3 分，主場略高)
    home_form_points = np.random.normal(1.55, 0.5, n).clip(0.0, 3.0)
    away_form_points = np.random.normal(1.35, 0.5, n).clip(0.0, 3.0)

    # 場均進/失球
    home_avg_goals_scored   = np.random.normal(1.45, 0.45, n).clip(0.3, 3.5)
    home_avg_goals_conceded = np.random.normal(1.10, 0.35, n).clip(0.3, 3.0)
    away_avg_goals_scored   = np.random.normal(1.20, 0.40, n).clip(0.3, 3.2)
    away_avg_goals_conceded = np.random.normal(1.35, 0.40, n).clip(0.3, 3.2)

    # 平局率
    home_draw_rate = np.random.beta(2, 5, n).clip(0.05, 0.50)
    away_draw_rate = np.random.beta(2, 5, n).clip(0.05, 0.50)

    # H2H
    h2h_home_win_rate = np.random.beta(2, 2, n).clip(0.05, 0.95)
    h2h_draw_rate     = np.random.beta(1, 4, n).clip(0.0, 0.45)

    # 生成標籤: 以特徵加權決定勝者 (加入隨機性模擬真實不確定性)
    home_strength = (
        home_win_rate * 0.40 +
        (home_form_points / 3.0) * 0.30 +
        ((home_avg_goals_scored - home_avg_goals_conceded + 2) / 4) * 0.20 +
        h2h_home_win_rate * 0.10
    )
    away_strength = (
        away_win_rate * 0.40 +
        (away_form_points / 3.0) * 0.30 +
        ((away_avg_goals_scored - away_avg_goals_conceded + 2) / 4) * 0.20 +
        (1 - h2h_home_win_rate - h2h_draw_rate).clip(0, 1) * 0.10
    )

    outcomes = []
    for h, a, dr in zip(home_strength, away_strength, h2h_draw_rate):
        noise = np.random.normal(0, 0.07)
        diff = (h - a) + noise
        if diff > 0.12:
            outcomes.append(0)   # 主隊勝
        elif diff < -0.09:
            outcomes.append(2)   # 客隊勝
        else:
            outcomes.append(1)   # 平局
    outcomes = np.array(outcomes)

    # 合成賠率隱含機率 (模擬市場根據強度定盤，加入噪音)
    # 正規化後三項之和為 1.0
    odds_home_raw = home_strength + np.random.normal(0, 0.03, n)
    odds_draw_raw = (1 - np.abs(home_strength - away_strength)) * 0.35 + np.random.normal(0, 0.02, n)
    odds_away_raw = away_strength + np.random.normal(0, 0.03, n)
    odds_home_raw = np.clip(odds_home_raw, 0.05, 0.85)
    odds_draw_raw = np.clip(odds_draw_raw, 0.05, 0.45)
    odds_away_raw = np.clip(odds_away_raw, 0.05, 0.80)
    odds_total = odds_home_raw + odds_draw_raw + odds_away_raw
    odds_home_implied = odds_home_raw / odds_total
    odds_draw_implied = odds_draw_raw / odds_total
    odds_away_implied = odds_away_raw / odds_total

    X = pd.DataFrame({
        'home_win_rate':           home_win_rate,
        'home_form_points':        home_form_points,
        'home_avg_goals_scored':   home_avg_goals_scored,
        'home_avg_goals_conceded': home_avg_goals_conceded,
        'home_draw_rate':          home_draw_rate,
        'away_win_rate':           away_win_rate,
        'away_form_points':        away_form_points,
        'away_avg_goals_scored':   away_avg_goals_scored,
        'away_avg_goals_conceded': away_avg_goals_conceded,
        'away_draw_rate':          away_draw_rate,
        'h2h_home_win_rate':       h2h_home_win_rate,
        'h2h_draw_rate':           h2h_draw_rate,
        'odds_home_implied':       odds_home_implied,
        'odds_draw_implied':       odds_draw_implied,
        'odds_away_implied':       odds_away_implied,
    })[SOCCER_FEATURE_COLUMNS]

    return X, outcomes


def generate_baseball_features(n: int) -> tuple:
    """
    生成棒球預測特徵與標籤
    MLB 統計: 主場勝 ~54%，無平局
    """
    n = int(n)

    home_win_rate = np.random.beta(3, 2.3, n).clip(0.10, 0.90)
    away_win_rate = np.random.beta(2.3, 3, n).clip(0.10, 0.85)

    home_form_points = np.random.normal(1.60, 0.45, n).clip(0.0, 3.0)
    away_form_points = np.random.normal(1.40, 0.45, n).clip(0.0, 3.0)

    home_avg_goals_scored   = np.random.normal(4.6, 0.9, n).clip(1.5, 9.0)   # MLB 場均得分
    home_avg_goals_conceded = np.random.normal(4.2, 0.8, n).clip(1.5, 8.5)
    away_avg_goals_scored   = np.random.normal(4.3, 0.9, n).clip(1.5, 9.0)
    away_avg_goals_conceded = np.random.normal(4.5, 0.8, n).clip(1.5, 8.5)

    # 棒球無平局，draw_rate = 0
    home_draw_rate = np.zeros(n)
    away_draw_rate = np.zeros(n)
    h2h_home_win_rate = np.random.beta(2.5, 2, n).clip(0.10, 0.90)
    h2h_draw_rate     = np.zeros(n)

    X = pd.DataFrame({
        'home_win_rate':           home_win_rate,
        'home_form_points':        home_form_points,
        'home_avg_goals_scored':   home_avg_goals_scored,
        'home_avg_goals_conceded': home_avg_goals_conceded,
        'home_draw_rate':          home_draw_rate,
        'away_win_rate':           away_win_rate,
        'away_form_points':        away_form_points,
        'away_avg_goals_scored':   away_avg_goals_scored,
        'away_avg_goals_conceded': away_avg_goals_conceded,
        'away_draw_rate':          away_draw_rate,
        'h2h_home_win_rate':       h2h_home_win_rate,
        'h2h_draw_rate':           h2h_draw_rate,
    })[BASEBALL_FEATURE_COLUMNS]

    home_strength = (
        home_win_rate * 0.45 +
        (home_form_points / 3.0) * 0.30 +
        ((home_avg_goals_scored - home_avg_goals_conceded + 8) / 16) * 0.15 +
        h2h_home_win_rate * 0.10
    )
    away_strength = (
        away_win_rate * 0.45 +
        (away_form_points / 3.0) * 0.30 +
        ((away_avg_goals_scored - away_avg_goals_conceded + 8) / 16) * 0.15 +
        (1 - h2h_home_win_rate).clip(0, 1) * 0.10
    )

    outcomes = []
    for h, a in zip(home_strength, away_strength):
        noise = np.random.normal(0, 0.06)
        outcomes.append(0 if (h - a + noise) >= 0 else 1)  # 0=主勝, 1=客勝

    return X, np.array(outcomes)


def train_model(X, y, sport_name: str, num_classes: int = 3,
                feature_columns=None) -> xgb.XGBClassifier:
    """訓練 XGBoost 分類模型並評估準確率"""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42,
        stratify=y if num_classes > 2 else None
    )

    model = xgb.XGBClassifier(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.04,
        subsample=0.8,
        colsample_bytree=0.8,
        gamma=0.12,
        reg_alpha=0.1,
        reg_lambda=1.0,
        min_child_weight=5,
        eval_metric='mlogloss' if num_classes > 2 else 'logloss',
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"  {sport_name} 模型準確率 (測試集): {acc:.1%}")
    print(f"  (合成資料訓練，真實準確率請執行 collect_and_train.py)")

    return model


def main():
    os.makedirs(MODEL_DIR, exist_ok=True)
    print("=" * 55)
    print("  WINGAME AI 模型訓練程序 (合成數據)")
    print("=" * 55)

    # 訓練足球模型 (3分類: 主勝/平/客勝)
    print("\n[1/2] 訓練足球預測模型...")
    X_soccer, y_soccer = generate_soccer_features(N_SAMPLES)
    soccer_model = train_model(X_soccer, y_soccer, '足球', num_classes=3,
                               feature_columns=SOCCER_FEATURE_COLUMNS)
    soccer_path = os.path.join(MODEL_DIR, 'soccer_model.pkl')
    with open(soccer_path, 'wb') as f:
        pickle.dump({'model': soccer_model, 'feature_columns': SOCCER_FEATURE_COLUMNS}, f)
    print(f"  已儲存: {soccer_path}")

    # 訓練棒球模型 (2分類: 主勝/客勝)
    print("\n[2/2] 訓練棒球預測模型...")
    X_baseball, y_baseball = generate_baseball_features(N_SAMPLES)
    baseball_model = train_model(X_baseball, y_baseball, '棒球', num_classes=2,
                                 feature_columns=BASEBALL_FEATURE_COLUMNS)
    baseball_path = os.path.join(MODEL_DIR, 'baseball_model.pkl')
    with open(baseball_path, 'wb') as f:
        pickle.dump({'model': baseball_model, 'feature_columns': BASEBALL_FEATURE_COLUMNS}, f)
    print(f"  已儲存: {baseball_path}")

    print("\n" + "=" * 55)
    print("  模型訓練完成！系統已準備好接受分析請求")
    print("  若要用真實數據提升準確率:")
    print("  python collect_and_train.py")
    print("=" * 55)


if __name__ == '__main__':
    main()
