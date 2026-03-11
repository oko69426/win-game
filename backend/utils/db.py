"""
WINGAME AI - SQLite 資料庫工具
負責連接管理、建表、CRUD 操作
"""
import sqlite3
import json
import time
import uuid
import os
import sys

# 加入父目錄到路徑以便 import config
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import DB_PATH


def get_connection():
    """取得 SQLite 連接，自動設定 row_factory"""
    # 確保目錄存在
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """初始化資料庫，建立所需資料表"""
    conn = get_connection()
    conn.executescript("""
        -- 分析歷史記錄表
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            sport_type TEXT,
            home_team TEXT,
            away_team TEXT,
            match_time TEXT,
            ocr_raw TEXT,
            odds_json TEXT,
            prediction_json TEXT,
            created_at REAL
        );

        -- API 回應快取表
        CREATE TABLE IF NOT EXISTS api_cache (
            url TEXT PRIMARY KEY,
            response_json TEXT,
            cached_at REAL,
            ttl INTEGER
        );
    """)
    conn.commit()
    conn.close()
    print("資料庫初始化完成")


def get_cached_response(url: str):
    """從快取取得 API 回應，若過期或不存在則返回 None"""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT response_json, cached_at, ttl FROM api_cache WHERE url = ?",
            (url,)
        ).fetchone()
        if row and (time.time() - row['cached_at']) < row['ttl']:
            return json.loads(row['response_json'])
        return None
    finally:
        conn.close()


def save_cached_response(url: str, data: dict, ttl: int):
    """儲存 API 回應到快取"""
    conn = get_connection()
    try:
        conn.execute(
            "INSERT OR REPLACE INTO api_cache VALUES (?, ?, ?, ?)",
            (url, json.dumps(data, ensure_ascii=False), time.time(), ttl)
        )
        conn.commit()
    finally:
        conn.close()


def save_analysis(data: dict) -> str:
    """儲存分析結果，返回分析 ID"""
    analysis_id = str(uuid.uuid4())[:8].upper()
    conn = get_connection()
    try:
        conn.execute("""
            INSERT INTO analyses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            analysis_id,
            data.get('sport_type'),
            data['ocr_result'].get('home_team'),
            data['ocr_result'].get('away_team'),
            data['ocr_result'].get('match_time'),
            data['ocr_result'].get('raw_text', '')[:1000],
            json.dumps(data['ocr_result'].get('odds', {}), ensure_ascii=False),
            json.dumps(data['prediction'], ensure_ascii=False),
            data['timestamp']
        ))
        conn.commit()
    finally:
        conn.close()
    return analysis_id


def get_analyses(limit: int = 20) -> list:
    """取得最近的分析記錄"""
    conn = get_connection()
    try:
        rows = conn.execute("""
            SELECT id, sport_type, home_team, away_team, match_time,
                   odds_json, prediction_json, created_at
            FROM analyses
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,)).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
