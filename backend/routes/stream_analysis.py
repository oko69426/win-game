"""
WINGAME AI — 即時串流分析路由
POST /api/stream                  → 建立 session，回傳 session_id
GET  /api/stream/<sid>            → 輪詢最新 stats (JSON)
GET  /api/stream/<sid>/events     → SSE 推送（備用）
DELETE /api/stream/<sid>          → 停止分析
"""
import json
import time
from flask import Blueprint, request, jsonify, Response, stream_with_context

from services.stream_service import create_session, get_session, stop_session

stream_bp = Blueprint('stream', __name__)


@stream_bp.route('/stream', methods=['POST'])
def start_stream():
    data = request.get_json(silent=True) or {}
    url  = (data.get('url') or '').strip()
    if not url:
        return jsonify({'error': '請提供影片網址'}), 400

    sid = create_session(url)
    return jsonify({'session_id': sid}), 202


@stream_bp.route('/stream/<sid>', methods=['GET'])
def get_stats(sid):
    session = get_session(sid)
    if session is None:
        return jsonify({'error': '找不到此分析 Session'}), 404
    return jsonify(session.latest)


@stream_bp.route('/stream/<sid>/events', methods=['GET'])
def sse_events(sid):
    """Server-Sent Events — 前端用 EventSource 連接"""
    def _generate():
        while True:
            session = get_session(sid)
            if session is None:
                yield f"data: {json.dumps({'status': 'ended'})}\n\n"
                break
            payload = json.dumps(session.latest)
            yield f"data: {payload}\n\n"
            if session.latest.get('status') == 'ended':
                break
            time.sleep(0.8)

    return Response(
        stream_with_context(_generate()),
        content_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
        },
    )


@stream_bp.route('/stream/<sid>', methods=['DELETE'])
def delete_stream(sid):
    stop_session(sid)
    return jsonify({'ok': True})
