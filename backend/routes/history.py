"""
WINGAME AI - 歷史記錄路由
GET /api/history - 取得最近分析記錄
"""
from flask import Blueprint, jsonify, request
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from utils.db import get_analyses

history_bp = Blueprint('history', __name__)


@history_bp.route('/history', methods=['GET'])
def get_history():
    """取得最近 20 筆分析記錄"""
    limit = request.args.get('limit', 20, type=int)
    rows = get_analyses(limit=min(limit, 50))

    # 解析 JSON 字串欄位
    results = []
    for row in rows:
        item = dict(row)
        try:
            item['odds'] = json.loads(item.pop('odds_json', '{}'))
            item['prediction'] = json.loads(item.pop('prediction_json', '{}'))
        except Exception:
            item['odds'] = {}
            item['prediction'] = {}
        results.append(item)

    return jsonify({'success': True, 'data': results, 'count': len(results)})
