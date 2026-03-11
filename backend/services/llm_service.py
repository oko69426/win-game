"""
WINGAME AI - LLM 分析報告服務
使用 DashScope Qwen API 生成繁體中文賽事深度分析
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    import requests as _requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False

# API 設定
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "sk-c50f08d06f8a4f9e9f5f03dfd68414fa")
DASHSCOPE_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
MODEL = "qwen-plus"  # 性價比最高，支援繁中


def generate_match_analysis(
    home_team: str,
    away_team: str,
    sport_type: str,
    prediction: dict,
    api_data: dict,
    ocr_data: dict,
) -> str:
    """
    呼叫 Qwen API 生成繁體中文賽事分析報告
    失敗時返回 None，不影響主流程
    """
    if not _HAS_REQUESTS or not DASHSCOPE_API_KEY:
        return None

    winner = prediction.get("winner", {})
    over_under = prediction.get("over_under", {})
    recommended = prediction.get("recommended", "")
    confidence = prediction.get("confidence_level", "中")
    tier_label = prediction.get("tier_label", "統計模型")

    home_win_pct = winner.get("home_win", 0)
    draw_pct = winner.get("draw", 0)
    away_win_pct = winner.get("away_win", 0)

    home_win_rate = api_data.get("home_win_rate", 0.5)
    away_win_rate = api_data.get("away_win_rate", 0.5)
    home_form = api_data.get("home_form_score", 50)
    away_form = api_data.get("away_form_score", 50)
    home_goals = api_data.get("home_avg_goals", 1.3)
    away_goals = api_data.get("away_avg_goals", 1.3)
    api_source = api_data.get("api_source", "none")

    odds = ocr_data.get("odds", {})
    odds_info = ""
    if odds.get("home_win"):
        odds_info += f"主隊賠率 {odds['home_win']}"
    if odds.get("draw") and sport_type == "soccer":
        odds_info += f"、平局 {odds['draw']}"
    if odds.get("away_win"):
        odds_info += f"、客隊 {odds['away_win']}"

    sport_name = "足球" if sport_type == "soccer" else "棒球"
    draw_line = f"平局機率 {draw_pct}%、" if sport_type == "soccer" else ""

    over_line = ""
    if over_under:
        over_line = (
            f"大小球分析: 大球機率 {over_under.get('over', 50)}%、"
            f"小球 {over_under.get('under', 50)}%，"
            f"建議 {over_under.get('recommendation', '')}。"
        )

    data_note = f"數據來源: {api_source}" if api_source != "none" else "（使用統計模型推算）"

    prompt = f"""你是一位資深{sport_name}數據分析師，專門為台灣用戶撰寫賽事分析報告。
請根據以下數據，用**繁體中文**撰寫一段 150-200 字的專業分析報告。

【賽事資訊】
主隊: {home_team}
客隊: {away_team}
運動類型: {sport_name}
{f'截圖賠率: {odds_info}' if odds_info else ''}

【統計數據】
主隊歷史勝率: {home_win_rate:.1%}，場均進球: {home_goals:.1f}
客隊歷史勝率: {away_win_rate:.1%}，場均進球: {away_goals:.1f}
{data_note}

【AI 模型預測結果】({tier_label})
主隊勝出機率: {home_win_pct}%
{draw_line}客隊勝出機率: {away_win_pct}%
信心等級: {confidence}
最終建議: {recommended}
{over_line}

【撰寫要求】
1. 直接分析比賽，不要說「根據以上數據」等套話
2. 點出主客隊各自的優劣勢
3. 說明為何 AI 推薦「{recommended}」
4. 語氣專業但不誇張，最後提醒僅供參考
5. 不要使用 markdown 標記，純文字即可"""

    try:
        resp = _requests.post(
            DASHSCOPE_URL,
            headers={
                "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "input": {
                    "messages": [
                        {"role": "system", "content": "你是專業體育數據分析師，以繁體中文提供精準、客觀的賽事分析。"},
                        {"role": "user", "content": prompt},
                    ]
                },
                "parameters": {
                    "max_tokens": 400,
                    "temperature": 0.7,
                    "result_format": "message",
                },
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        content = (
            data.get("output", {})
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        return content.strip() if content else None

    except Exception as e:
        print(f"[LLM] Qwen API 呼叫失敗: {e}")
        return None
