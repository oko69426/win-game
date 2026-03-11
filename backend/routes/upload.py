"""
WINGAME AI - 截圖上傳與分析主路由
POST /api/upload - 完整分析管線:
  截圖 → OCR → 體育API → ML預測 → 儲存 → 返回結果
"""
import os
import sys
import uuid
import time

from flask import Blueprint, request, jsonify

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import UPLOAD_FOLDER, ALLOWED_EXTENSIONS
from services.ocr_service import extract_match_info
from services.api_service import fetch_team_history
from services.ml_service import predict_match
from services.llm_service import generate_match_analysis
from utils.db import save_analysis

upload_bp = Blueprint('upload', __name__)


def _allowed_file(filename: str) -> bool:
    """檢查副檔名是否允許"""
    return ('.' in filename and
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS)


@upload_bp.route('/upload', methods=['POST'])
def upload_screenshot():
    """
    接收截圖並執行完整分析管線

    Form data:
        file: 圖片檔案 (PNG/JPG)
        sport_type: 'auto' | 'soccer' | 'baseball'

    Returns JSON:
        success, analysis_id, sport_type, match_info, prediction, disclaimer
    """
    # 驗證請求
    if 'file' not in request.files:
        return jsonify({'error': '請上傳截圖檔案 (form field: file)'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': '未選擇檔案'}), 400

    if not _allowed_file(file.filename):
        return jsonify({'error': '不支援的檔案格式，請上傳 PNG 或 JPG 截圖'}), 400

    sport_type = request.form.get('sport_type', 'auto')

    # 儲存暫時檔案
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    ext = file.filename.rsplit('.', 1)[1].lower()
    temp_filename = f"{uuid.uuid4()}.{ext}"
    temp_path = os.path.join(UPLOAD_FOLDER, temp_filename)
    file.save(temp_path)

    try:
        # === 步驟 1: OCR 文字識別 ===
        print(f"[{temp_filename}] 步驟1: OCR 識別中...")
        ocr_result = extract_match_info(temp_path, sport_type)

        if not ocr_result.get('success'):
            return jsonify({
                'error': ocr_result.get('message', '無法識別截圖內容'),
                'hint': '請確認截圖清晰，且包含「主隊 vs 客隊」格式的比賽資訊',
                'ocr_raw': ocr_result.get('ocr_text_preview', '')
            }), 422

        detected_sport = ocr_result.get('sport_type', sport_type)
        print(f"[{temp_filename}] OCR 完成: {ocr_result['home_team']} vs {ocr_result['away_team']} ({detected_sport})")

        # === 步驟 2: 查詢體育 API 歷史數據 ===
        print(f"[{temp_filename}] 步驟2: 查詢歷史數據...")
        api_data = fetch_team_history(
            home_team=ocr_result['home_team'],
            away_team=ocr_result['away_team'],
            sport_type=detected_sport
        )
        print(f"[{temp_filename}] API 來源: {api_data.get('api_source', 'none')}")

        # === 步驟 3: ML 模型預測 ===
        print(f"[{temp_filename}] 步驟3: ML 預測中...")
        prediction = predict_match(
            ocr_data=ocr_result,
            api_data=api_data,
            sport_type=detected_sport
        )
        print(f"[{temp_filename}] 預測完成: {prediction.get('recommended')} "
              f"({prediction.get('tier_label')})")

        # === 步驟 4: Qwen AI 生成中文分析報告 ===
        print(f"[{temp_filename}] 步驟4: 生成 AI 分析報告...")
        llm_analysis = generate_match_analysis(
            home_team=ocr_result['home_team'],
            away_team=ocr_result['away_team'],
            sport_type=detected_sport,
            prediction=prediction,
            api_data=api_data,
            ocr_data=ocr_result,
        )
        if llm_analysis:
            print(f"[{temp_filename}] AI 報告生成完成 ({len(llm_analysis)} 字)")
        else:
            print(f"[{temp_filename}] AI 報告生成跳過（API 未設定或失敗）")

        # === 步驟 5: 儲存記錄 ===
        analysis_id = save_analysis({
            'sport_type': detected_sport,
            'ocr_result': ocr_result,
            'api_data': api_data,
            'prediction': prediction,
            'timestamp': time.time()
        })

        # === 組合回應 ===
        response = {
            'success': True,
            'analysis_id': analysis_id,
            'sport_type': detected_sport,
            'sport_label': '足球' if detected_sport == 'soccer' else '棒球',
            'match_info': {
                'home_team': ocr_result['home_team'],
                'away_team': ocr_result['away_team'],
                'match_time': ocr_result.get('match_time', '未知'),
                'odds': ocr_result.get('odds', {}),
                'ocr_confidence': ocr_result.get('confidence', 0),
                'mock_mode': ocr_result.get('mock_mode', False),
            },
            'prediction': prediction,
            'ai_analysis': llm_analysis,
            'api_info': {
                'source': api_data.get('api_source', 'none'),
                'available': api_data.get('api_available', False),
            },
            'stats': {
                'home_win_rate': round(api_data.get('home_win_rate', 0.50), 3),
                'away_win_rate': round(api_data.get('away_win_rate', 0.45), 3),
                'home_form_score': api_data.get('home_form_score', 52.0),
                'away_form_score': api_data.get('away_form_score', 50.0),
                'home_avg_goals': api_data.get('home_avg_goals', 1.3),
                'away_avg_goals': api_data.get('away_avg_goals', 1.3),
                'h2h_home_wins': api_data.get('head_to_head_home_wins', 0),
                'h2h_draws': api_data.get('head_to_head_draws', 0),
                'h2h_away_wins': api_data.get('head_to_head_away_wins', 0),
            },
            'disclaimer': (
                '⚠️ 以上預測僅供參考，不構成投注建議。'
                '運動賽事結果受多種不可預測因素影響。'
                '請理性娛樂，量力而為。'
            )
        }

        return jsonify(response), 200

    except Exception as e:
        print(f"[{temp_filename}] 分析過程發生錯誤: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': f'系統分析失敗，請重試',
            'detail': str(e)
        }), 500

    finally:
        # 清理暫存檔
        if os.path.exists(temp_path):
            os.remove(temp_path)
