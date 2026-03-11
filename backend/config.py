"""
WINGAME AI - 全局設定
"""
import os

# API 金鑰 - 從環境變數讀取，或填入預設值
FOOTBALL_DATA_API_KEY = os.getenv("FOOTBALL_DATA_KEY", "e362c92c48e147e689dc7a48770b0f0e")
THESPORTSDB_API_KEY = "3"  # TheSportsDB 免費層固定使用 "3"
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "sk-c50f08d06f8a4f9e9f5f03dfd68414fa")

# 資料庫路徑
DB_PATH = os.path.join(os.path.dirname(__file__), "data", "smartsports.db")

# ML 模型路徑
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
SOCCER_MODEL_PATH = os.path.join(MODEL_DIR, "soccer_model.pkl")
BASEBALL_MODEL_PATH = os.path.join(MODEL_DIR, "baseball_model.pkl")

# API 快取時間 (秒)
CACHE_TTL = 3600  # 1 小時

# 上傳設定
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads_temp")
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB

# Flask 設定
DEBUG = True
HOST = "0.0.0.0"
PORT = int(os.getenv("PORT", 8080))
