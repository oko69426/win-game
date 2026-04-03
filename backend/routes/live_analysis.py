"""
WINGAME AI — 賽事即時分析路由
POST /api/live-analysis              → 啟動分析 job，回傳 job_id
GET  /api/live-analysis/<id>         → 輪詢 job 狀態 + 結果
GET  /api/live-analysis/clip/<name>  → 串流標注影片片段
"""
import os
from pathlib import Path
from flask import Blueprint, request, jsonify, send_file, abort
from services.video_service import start_job, get_job

live_analysis_bp = Blueprint('live_analysis', __name__)


@live_analysis_bp.route('/live-analysis', methods=['POST'])
def create_job():
    data = request.get_json(silent=True) or {}
    url  = (data.get('url') or '').strip()
    if not url:
        return jsonify({'error': '請提供 YouTube 網址'}), 400
    if 'youtube.com' not in url and 'youtu.be' not in url:
        return jsonify({'error': '僅支援 YouTube 網址'}), 400

    start    = int(data.get('start', 0))
    duration = min(int(data.get('duration', 45)), 90)

    job_id = start_job(url, start_time=start, duration=duration)
    return jsonify({'job_id': job_id, 'status': 'queued'}), 202


@live_analysis_bp.route('/live-analysis/<job_id>', methods=['GET'])
def poll_job(job_id):
    job = get_job(job_id)
    if job is None:
        return jsonify({'error': '找不到此分析工作'}), 404
    # 不把大型 video_clip_path 傳到前端
    safe = {k: v for k, v in job.items() if k != 'video_clip_path'}
    return jsonify(safe)


@live_analysis_bp.route('/live-analysis/clip/<path:filename>', methods=['GET'])
def serve_clip(filename):
    """提供標注後的影片片段（僅接受 *_annotated.mp4）"""
    if not filename.endswith('_annotated.mp4'):
        abort(404)
    # 搜尋 /tmp 底下對應的檔案
    for tmp_root in ['/tmp', 'C:/Users/Adam/AppData/Local/Temp']:
        candidates = Path(tmp_root).glob(f'wg_*/{filename}')
        for p in candidates:
            if p.exists():
                return send_file(str(p), mimetype='video/mp4',
                                 as_attachment=False,
                                 download_name=filename)
    abort(404)
