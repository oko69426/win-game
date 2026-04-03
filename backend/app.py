"""
WINGAME AI - Flask 主應用程式
啟動指令: python app.py
"""
import os
import sys

# 確保可以 import 同層模組
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, send_from_directory
from flask_cors import CORS

from routes.health import health_bp
from routes.history import history_bp
from routes.upload import upload_bp
from routes.daily_picks import daily_picks_bp
from routes.live_analysis import live_analysis_bp
from routes.stream_analysis import stream_bp
from utils.db import init_db
from config import HOST, PORT, DEBUG, UPLOAD_FOLDER


def create_app():
    """建立並設定 Flask 應用程式"""
    static_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build')
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB

    # 允許前端跨域 (dev: localhost:3000, prod: Vercel 網域或 *)
    frontend_url = os.environ.get('FRONTEND_URL', '*')
    origins = [o.strip() for o in frontend_url.split(',')] if frontend_url != '*' else '*'
    CORS(app, origins=origins)

    # 初始化資料庫
    init_db()

    # 確保暫存上傳目錄存在
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # 註冊路由藍圖
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(history_bp, url_prefix='/api')
    app.register_blueprint(upload_bp, url_prefix='/api')
    app.register_blueprint(daily_picks_bp, url_prefix='/api')
    app.register_blueprint(live_analysis_bp, url_prefix='/api')
    app.register_blueprint(stream_bp, url_prefix='/api')

    # Catch-all: 將非 /api/ 路徑交給 React Router 處理
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        if path.startswith('api/'):
            from flask import abort
            abort(404)
        # 若靜態檔案存在則直接回傳，否則回傳 index.html
        full_path = os.path.join(static_folder, path)
        if path and os.path.exists(full_path):
            return send_from_directory(static_folder, path)
        return send_from_directory(static_folder, 'index.html')

    return app


if __name__ == '__main__':
    print("=" * 50)
    print("  WINGAME AI 後端啟動中...")
    print(f"  API 地址: http://{HOST}:{PORT}")
    print("=" * 50)
    app = create_app()
    port = int(os.environ.get('PORT', PORT))
    app.run(host=HOST, port=port, debug=False)
