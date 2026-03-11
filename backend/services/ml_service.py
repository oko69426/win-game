"""
WINGAME AI - 機器學習預測服務
三層 Fallback 架構:
  Tier 1: XGBoost 模型 (pkl 存在)
  Tier 2: 規則推算 (賠率隱含機率 + 歷史勝率加權)

pkl 格式: dict {'model': XGBClassifier, 'feature_columns': [...]}
  - 足球 15 維 (含賠率隱含機率)
  - 棒球 12 維 (無賠率)
"""
import pickle
import numpy as np
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import SOCCER_MODEL_PATH, BASEBALL_MODEL_PATH

# 模型快取: {sport_type: {'model': ..., 'feature_columns': [...]}}
_models = {}

# 足球特徵欄位 (15維, 含賠率) — 訓練時使用此順序
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


def _load_model(sport_type: str):
    """載入並快取模型 (支援舊版XGBClassifier pkl 和新版 dict pkl)"""
    if sport_type not in _models:
        path = SOCCER_MODEL_PATH if sport_type == 'soccer' else BASEBALL_MODEL_PATH
        default_cols = SOCCER_FEATURE_COLUMNS if sport_type == 'soccer' else BASEBALL_FEATURE_COLUMNS
        if os.path.exists(path):
            try:
                with open(path, 'rb') as f:
                    obj = pickle.load(f)
                # 新格式: dict with 'model' and 'feature_columns'
                if isinstance(obj, dict) and 'model' in obj:
                    _models[sport_type] = {
                        'model': obj['model'],
                        'feature_columns': obj.get('feature_columns', default_cols),
                    }
                else:
                    # 舊格式: 直接是 XGBClassifier
                    _models[sport_type] = {
                        'model': obj,
                        'feature_columns': BASEBALL_FEATURE_COLUMNS,  # 舊版是12維
                    }
                n_feat = len(_models[sport_type]['feature_columns'])
                print(f"已載入 {sport_type} 模型 ({n_feat} 維特徵)")
            except Exception as e:
                print(f"模型載入失敗: {e}")
                _models[sport_type] = None
        else:
            print(f"模型檔案不存在: {path}")
            _models[sport_type] = None
    return _models[sport_type]


def predict_match(ocr_data: dict, api_data: dict, sport_type: str,
                  ocr_handicap: dict = None) -> dict:
    """
    主要預測函式

    Returns dict with:
        model_used: bool
        tier: int (1=ML, 2=rule-based)
        winner: {home_win, draw, away_win} (百分比)
        over_under: {over, under, line}
        recommended: str
        recommended_reason: str
        confidence_level: str ('高'/'中'/'低')
    """
    model_obj = _load_model(sport_type)
    features = _build_features(ocr_data, api_data, sport_type)
    # Pass OCR handicap through for use in prediction output
    features['_ocr_handicap'] = ocr_handicap or ocr_data.get('handicap', {})

    if model_obj is not None:
        return _ml_prediction(model_obj['model'], features, sport_type,
                              model_obj['feature_columns'])
    else:
        return _rule_based_prediction(features, sport_type)


def _build_features(ocr_data: dict, api_data: dict, sport_type: str) -> dict:
    """
    組合 OCR 賠率數據 + API 歷史數據 為特徵向量
    ML 模型特徵與 train_real_data.py 一致 (無賠率)
    賠率特徵保留給規則推算使用
    """
    odds = ocr_data.get('odds', {})

    # 賠率隱含機率 (僅用於規則推算 fallback)
    def implied(odd_val, default):
        try:
            v = float(odd_val)
            if 1.01 <= v <= 20.0:
                return 1.0 / v
        except (TypeError, ValueError):
            pass
        return default

    home_win_rate = api_data.get('home_win_rate', 0.45)
    away_win_rate = api_data.get('away_win_rate', 0.45)

    # form_score (0-100) → form_points (0-3): 勝=3分, 平=1分, 負=0分
    # form_score 本質上是勝率*100，換算: 平均積分 ≈ win_rate*3 + draw_rate*1
    # 這裡用 form_score/100 * 2.5 近似 (league avg ~1.4 pts/game)
    home_form_pts = (api_data.get('home_form_score', 52.0) / 100.0) * 2.5
    away_form_pts = (api_data.get('away_form_score', 50.0) / 100.0) * 2.5

    home_goals = api_data.get('home_avg_goals', 1.3)
    away_goals = api_data.get('away_avg_goals', 1.3)

    # 賠率隱含機率 (正規化，去除莊家抽水)
    raw_home = implied(odds.get('home_win'), 0.45)
    raw_draw = implied(odds.get('draw'), 0.27) if sport_type == 'soccer' else 0.0
    raw_away = implied(odds.get('away_win'), 0.28)
    raw_total = raw_home + raw_draw + raw_away
    if raw_total > 0:
        norm_home = raw_home / raw_total
        norm_draw = raw_draw / raw_total
        norm_away = raw_away / raw_total
    else:
        norm_home, norm_draw, norm_away = 0.45, 0.27, 0.28

    return {
        # 統計特徵 (12 維)
        'home_win_rate': home_win_rate,
        'home_form_points': round(home_form_pts, 3),
        'home_avg_goals_scored': home_goals,
        'home_avg_goals_conceded': away_goals * 1.05,  # 估算 (主場失球略低於客隊進球)
        'home_draw_rate': 0.25,  # 聯賽平均，API 未提供則用基準值
        'away_win_rate': away_win_rate,
        'away_form_points': round(away_form_pts, 3),
        'away_avg_goals_scored': away_goals,
        'away_avg_goals_conceded': home_goals * 1.05,
        'away_draw_rate': 0.25,
        'h2h_home_win_rate': _calc_h2h_rate(api_data, 'home'),
        'h2h_draw_rate': _calc_h2h_rate(api_data, 'draw'),
        # 賠率隱含機率 (3 維, ML 模型特徵)
        'odds_home_implied': round(norm_home, 4),
        'odds_draw_implied': round(norm_draw, 4),
        'odds_away_implied': round(norm_away, 4),
        # 原始賠率 (規則推算用)
        '_home_odds_implied': raw_home,
        '_away_odds_implied': raw_away,
        '_draw_odds_implied': raw_draw,
        '_over_odds_implied': implied(odds.get('over'), 0.52),
    }


def _calc_h2h_rate(api_data: dict, side: str) -> float:
    """計算歷史交鋒勝率"""
    h2h_home = api_data.get('head_to_head_home_wins', 0)
    h2h_draw = api_data.get('head_to_head_draws', 0)
    h2h_away = api_data.get('head_to_head_away_wins', 0)
    total = h2h_home + h2h_draw + h2h_away

    if total == 0:
        return 0.45 if side == 'home' else 0.25

    if side == 'home':
        return h2h_home / total
    elif side == 'draw':
        return h2h_draw / total
    return h2h_away / total


def _ml_prediction(model, features: dict, sport_type: str,
                   feature_columns=None) -> dict:
    """使用 XGBoost + 校準模型進行預測，含信心門檻"""
    cols = feature_columns or (SOCCER_FEATURE_COLUMNS if sport_type == 'soccer' else BASEBALL_FEATURE_COLUMNS)
    feature_array = np.array([[features.get(col, 0.0) for col in cols]])

    try:
        proba = model.predict_proba(feature_array)[0]
    except Exception as e:
        print(f"模型預測失敗，退回規則推算: {e}")
        return _rule_based_prediction(features, sport_type)

    if sport_type == 'soccer':
        # 足球: 0=主勝, 1=平, 2=客勝
        home_p = float(proba[0]) * 100
        draw_p = float(proba[1]) * 100
        away_p = float(proba[2]) * 100
    else:
        # 棒球: 0=主勝, 1=客勝
        home_p = float(proba[0]) * 100
        draw_p = 0.0
        away_p = float(proba[1]) * 100

    max_p = max(home_p, draw_p, away_p)
    confidence = _get_confidence_level(max_p)

    # 低信心時附加警告 (信心 < 55% 時市場分歧大，不建議投注)
    low_confidence_note = None
    if max_p < 55.0:
        low_confidence_note = f'三方機率差距小（最高 {max_p:.0f}%），建議本場觀望不投注'

    return {
        'model_used': True,
        'tier': 1,
        'tier_label': 'XGBoost 校準模型',
        'winner': {
            'home_win': round(home_p, 1),
            'draw': round(draw_p, 1),
            'away_win': round(away_p, 1),
        },
        'over_under': _predict_over_under(features, sport_type),
        'handicap': _predict_handicap(home_p, away_p, draw_p,
                                      features.get('_ocr_handicap')),
        'recommended': _get_winner_recommendation(home_p, draw_p, away_p, sport_type),
        'recommended_reason': _get_reason(features, home_p, away_p),
        'confidence_level': confidence,
        'low_confidence_note': low_confidence_note,
    }


def _rule_based_prediction(features: dict, sport_type: str) -> dict:
    """
    規則推算: 模型不存在時的退路
    加權組合賠率隱含機率 + 歷史勝率
    """
    home_form_norm = features['home_form_points'] / 3.0  # 0-3 → 0-1
    away_form_norm = features['away_form_points'] / 3.0
    h = features['_home_odds_implied'] * 0.55 + features['home_win_rate'] * 0.30 + home_form_norm * 0.15
    a = features['_away_odds_implied'] * 0.55 + features['away_win_rate'] * 0.30 + away_form_norm * 0.15
    d = features.get('_draw_odds_implied', 0) * 0.60 + 0.05

    # 正規化
    total = h + a + (d if sport_type == 'soccer' else 0)
    total = max(total, 0.01)

    home_p = h / total * 100
    draw_p = (d / total * 100) if sport_type == 'soccer' else 0
    away_p = a / total * 100

    return {
        'model_used': False,
        'tier': 2,
        'tier_label': '基礎統計推算',
        'tier_note': '模型尚未訓練，結果信度較低。請執行 install.bat 完成訓練',
        'winner': {
            'home_win': round(home_p, 1),
            'draw': round(draw_p, 1),
            'away_win': round(away_p, 1),
        },
        'over_under': _predict_over_under(features, sport_type),
        'handicap': _predict_handicap(home_p, away_p, draw_p,
                                      features.get('_ocr_handicap')),
        'recommended': _get_winner_recommendation(home_p, draw_p, away_p, sport_type),
        'recommended_reason': _get_reason(features, home_p, away_p),
        'confidence_level': '低',
    }


def _predict_over_under(features: dict, sport_type: str) -> dict:
    """預測大小球"""
    over_implied = features.get('_over_odds_implied', 0.52)
    total_goals = features.get('home_avg_goals_scored', 1.3) + features.get('away_avg_goals_scored', 1.3)

    # 大球機率: 賠率隱含 60% + 進球率估計 40%
    goals_factor = min(total_goals / 3.5, 1.0)  # 總進球 3.5 以上偏大
    over_p = (over_implied * 0.60 + goals_factor * 0.40) * 100
    over_p = max(30, min(70, over_p))  # 限制在 30~70% 之間

    line_label = '2.5 球' if sport_type == 'soccer' else '8.5 分'

    return {
        'over': round(over_p, 1),
        'under': round(100 - over_p, 1),
        'line': line_label,
        'recommendation': f'大 (Over {line_label})' if over_p >= 55 else f'小 (Under {line_label})'
    }


def _predict_handicap(home_p: float, away_p: float, draw_p: float,
                      ocr_handicap: dict = None) -> dict:
    """
    讓分盤 (Asian Handicap) 建議
    - 若 OCR 已讀到讓分盤數值，直接使用並解釋
    - 否則根據機率差推算建議讓分線
    """
    # 若截圖中已有讓分盤資訊
    if ocr_handicap and ocr_handicap.get('value') is not None:
        val = ocr_handicap['value']
        if val < 0:
            side_label = f'主隊讓 {abs(val):.1g} 球'.replace('.0', '')
        elif val > 0:
            side_label = f'客隊受讓 {val:.1g} 球'.replace('.0', '')
        else:
            side_label = '平手盤'
        return {
            'line': val,
            'display': ocr_handicap.get('display', f'{val:+.1f}'),
            'source': 'ocr',
            'side_label': side_label,
            'recommendation': '依截圖讓分盤投注強隊',
            'reason': '截圖中的讓分盤資訊，建議配合勝負機率判斷是否值得投注',
        }

    # 根據機率差推算
    prob_diff = home_p - away_p  # 正=主隊較強, 負=客隊較強

    if abs(prob_diff) < 8:
        return {
            'line': 0,
            'display': '平手盤 (0)',
            'source': 'model',
            'side_label': '平手盤',
            'recommendation': '平手盤 (不讓分)',
            'reason': '雙方實力接近，建議選擇平手盤以降低讓分風險',
        }
    elif prob_diff >= 20:
        return {
            'line': -1.0,
            'display': '主隊 -1 球',
            'source': 'model',
            'side_label': '主隊讓1球',
            'recommendation': '主隊讓1球',
            'reason': f'模型預測主隊勝率顯著 ({home_p:.0f}%)，可承擔1球讓分',
        }
    elif prob_diff >= 10:
        return {
            'line': -0.5,
            'display': '主隊 -0.5 球',
            'source': 'model',
            'side_label': '主隊讓半球',
            'recommendation': '主隊讓半球',
            'reason': f'主隊略佔優勢 ({home_p:.0f}%)，半球讓分風險可控',
        }
    elif prob_diff <= -20:
        return {
            'line': 1.0,
            'display': '客隊 -1 球 (主隊受讓1球)',
            'source': 'model',
            'side_label': '客隊讓1球',
            'recommendation': '客隊讓1球',
            'reason': f'模型預測客隊勝率顯著 ({away_p:.0f}%)，可承擔1球讓分',
        }
    else:  # prob_diff <= -10
        return {
            'line': 0.5,
            'display': '客隊 -0.5 球 (主隊受讓半球)',
            'source': 'model',
            'side_label': '客隊讓半球',
            'recommendation': '客隊讓半球',
            'reason': f'客隊略佔優勢 ({away_p:.0f}%)，半球讓分風險可控',
        }


def _get_winner_recommendation(home_p, draw_p, away_p, sport_type) -> str:
    """取得文字建議"""
    if sport_type == 'soccer':
        best = max(home_p, draw_p, away_p)
        if best == home_p:
            return '主隊勝'
        elif best == draw_p:
            return '平局'
        else:
            return '客隊勝'
    else:
        return '主隊勝' if home_p >= away_p else '客隊勝'


def _get_reason(features: dict, home_p: float, away_p: float) -> str:
    """生成推薦理由"""
    reasons = []
    if features['home_win_rate'] > 0.55:
        reasons.append('主隊歷史勝率高')
    if features['home_form_points'] > 1.8:
        reasons.append('主隊近期狀態佳')
    if features['_home_odds_implied'] > features['_away_odds_implied'] + 0.10:
        reasons.append('賠率市場看好主隊')
    if features['h2h_home_win_rate'] > 0.55:
        reasons.append('主隊歷史交鋒佔優')

    if features['away_win_rate'] > 0.55:
        reasons.append('客隊歷史勝率高')
    if features['away_form_points'] > 1.8:
        reasons.append('客隊近期狀態佳')

    return '、'.join(reasons[:3]) if reasons else '綜合數據分析'


def _get_confidence_level(max_prob: float) -> str:
    """根據校準後最高機率判斷信心等級
    (校準後 P=60% 表示實際勝率約 60%)
    """
    if max_prob >= 65:
        return '高'     # 統計上 ≥65% 準確率
    elif max_prob >= 55:
        return '中'     # 統計上 ≥55% 準確率
    else:
        return '低'     # < 55% 建議觀望
