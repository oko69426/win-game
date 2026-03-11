"""
WINGAME AI - OCR 服務
使用 EasyOCR 識別截圖中的文字
注意: 首次呼叫 get_reader() 會下載語言模型 (約 1-2 分鐘)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from utils.text_parser import (
    parse_team_names, parse_odds, parse_match_time, detect_sport_type, parse_handicap
)

# 延遲載入 EasyOCR Reader (避免啟動時的長時間初始化)
_reader = None


def get_reader():
    """取得 EasyOCR Reader 實例 (Lazy-load 模式)"""
    global _reader
    if _reader is None:
        print("初始化 OCR 引擎 (首次載入需要 1-2 分鐘)...")
        try:
            import easyocr
            # ch_tra = 繁體中文 (台灣), en = 英文數字賠率
            # 注意: ch_tra 和 ch_sim 不能同時載入，使用繁體覆蓋台灣截圖
            _reader = easyocr.Reader(['ch_tra', 'en'], gpu=False)
            print("OCR 引擎初始化完成")
        except ImportError:
            print("警告: EasyOCR 未安裝，使用模擬 OCR 模式")
            _reader = None
    return _reader


def extract_match_info(image_path: str, sport_type: str = 'auto') -> dict:
    """
    主要函式: 從截圖中提取比賽資訊

    Args:
        image_path: 截圖檔案路徑
        sport_type: 'soccer', 'baseball', 或 'auto'

    Returns:
        dict with keys: success, sport_type, home_team, away_team,
                        match_time, odds, raw_text, confidence
    """
    reader = get_reader()

    if reader is None:
        # 開發/測試模式: EasyOCR 未安裝時回傳模擬資料
        return _mock_ocr_result(sport_type)

    try:
        # EasyOCR 識別，返回 [(bbox, text, confidence), ...]
        raw_results = reader.readtext(image_path, detail=1, paragraph=False)

        # 只保留信心度 > 0.3 的結果
        text_blocks = [r[1] for r in raw_results if r[2] > 0.3]
        full_text = '\n'.join(text_blocks)

        print(f"OCR 識別到 {len(text_blocks)} 個文字區塊")

    except Exception as e:
        print(f"OCR 識別失敗: {e}")
        return {
            'success': False,
            'raw_text': '',
            'message': f'圖片識別失敗: {str(e)}'
        }

    # 自動偵測運動類型
    if sport_type == 'auto':
        sport_type = detect_sport_type(full_text)

    # 解析各項資訊
    teams = parse_team_names(full_text, sport_type)
    odds = parse_odds(full_text)
    match_time = parse_match_time(full_text)
    handicap = parse_handicap(full_text)
    confidence = _calc_extraction_confidence(teams, odds)

    if not teams.get('home') or not teams.get('away'):
        print(f"[OCR] 隊名識別失敗，原始文字塊:")
        for i, block in enumerate(text_blocks[:20]):
            print(f"  [{i}] {repr(block)}")
        return {
            'success': False,
            'raw_text': full_text,
            'sport_type': sport_type,
            'message': '無法識別隊伍名稱，請確認截圖包含 「隊名 vs 隊名」 格式',
            'ocr_text_preview': full_text[:300]
        }

    return {
        'success': True,
        'sport_type': sport_type,
        'home_team': teams['home'],
        'away_team': teams['away'],
        'match_time': match_time,
        'odds': odds,
        'handicap': handicap,
        'raw_text': full_text,
        'confidence': confidence
    }


def _calc_extraction_confidence(teams: dict, odds: dict) -> float:
    """計算資訊提取的整體信心度 (0.0 ~ 1.0)"""
    score = 0.0
    if teams.get('home'):
        score += 0.35
    if teams.get('away'):
        score += 0.35
    if odds.get('home_win'):
        score += 0.20
    if odds.get('away_win'):
        score += 0.10
    return round(score, 2)


def _mock_ocr_result(sport_type: str) -> dict:
    """
    開發模式: EasyOCR 未安裝時的模擬結果
    用於測試後續的 API 和 ML 管線
    """
    if sport_type == 'baseball' or sport_type == 'auto':
        sport_type = 'soccer'  # 預設足球

    return {
        'success': True,
        'sport_type': sport_type,
        'home_team': 'Manchester City',
        'away_team': 'Arsenal',
        'match_time': '2026-03-15 20:45',
        'odds': {
            'home_win': 1.75,
            'draw': 3.50,
            'away_win': 4.20,
            'over': 1.85,
            'under': 1.95,
            'total_line': 2.5
        },
        'raw_text': '[模擬模式] Manchester City vs Arsenal\n1.75 / 3.50 / 4.20',
        'confidence': 0.90,
        'mock_mode': True
    }
