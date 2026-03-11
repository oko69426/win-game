"""
WINGAME AI - 健康檢查路由
GET /api/health - 確認系統運作狀態
"""
from flask import Blueprint, jsonify
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import SOCCER_MODEL_PATH, BASEBALL_MODEL_PATH

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """系統健康檢查"""
    return jsonify({
        'status': 'ok',
        'message': 'WINGAME AI 系統運作正常',
        'models': {
            'soccer': os.path.exists(SOCCER_MODEL_PATH),
            'baseball': os.path.exists(BASEBALL_MODEL_PATH),
        }
    })
