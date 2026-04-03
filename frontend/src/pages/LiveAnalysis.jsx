import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, LinearProgress,
  Grid, Chip, Divider, IconButton, Tooltip,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import PeopleIcon from '@mui/icons-material/People';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import RadarIcon from '@mui/icons-material/Radar';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import StopIcon from '@mui/icons-material/Stop';
import { apiFetch } from '../services/api';

// ─── Animations ─────────────────────────────────────────────────────────────
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(244,59,48,0.5); }
  50%       { box-shadow: 0 0 0 14px rgba(244,59,48,0); }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const glow = keyframes`
  0%, 100% { border-color: rgba(0,102,255,0.4); }
  50%       { border-color: rgba(0,212,255,0.8); box-shadow: 0 0 18px rgba(0,212,255,0.25); }
`;
const liveBlink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
`;

const DEMO_URL = 'https://youtu.be/YsWzugAnsBw';
const POLL_MS  = 600;

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimCounter({ target, suffix = '' }) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const start = prev.current;
    const diff  = target - start;
    if (diff === 0) return;
    let frame = 0;
    const frames = 18;
    const id = setInterval(() => {
      frame++;
      setVal(Math.round(start + diff * (frame / frames)));
      if (frame >= frames) { prev.current = target; clearInterval(id); }
    }, 16);
    return () => clearInterval(id);
  }, [target]);
  return <>{val}{suffix}</>;
}

// ─── Danger Gauge (SVG Arc) ──────────────────────────────────────────────────
function DangerGauge({ value }) {
  const r = 42, cx = 56, cy = 56;
  const circ = Math.PI * r;
  const arc   = (value / 100) * circ;
  const color = value >= 75 ? '#F43B30' : value >= 50 ? '#FFB300' : '#00C853';
  return (
    <Box sx={{ position: 'relative', width: 112, height: 72, mx: 'auto' }}>
      <svg width="112" height="72" viewBox="0 0 112 72">
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${arc} ${circ}`}
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <Box sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>
          <AnimCounter target={value} />
        </Typography>
        <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
          / 100
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Momentum Line ───────────────────────────────────────────────────────────
function MomentumChart({ data, labelHome, labelAway }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!data?.length || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { t: 8, b: 24, l: 8, r: 8 };
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    const midY = pad.t + iH / 2;
    ctx.beginPath(); ctx.moveTo(pad.l, midY); ctx.lineTo(W - pad.r, midY); ctx.stroke();
    ctx.setLineDash([]);
    const pts = data.map((v, i) => ({
      x: pad.l + (i / Math.max(data.length - 1, 1)) * iW,
      y: pad.t + (1 - v / 100) * iH,
    }));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, pad.t + iH);
    ctx.lineTo(pts[0].x, pad.t + iH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + iH);
    grad.addColorStop(0, 'rgba(0,102,255,0.35)');
    grad.addColorStop(1, 'rgba(0,102,255,0.03)');
    ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.strokeStyle = '#00D4FF'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '10px Inter,sans-serif';
    ctx.fillText(labelHome || '主隊', pad.l + 2, pad.t + iH - 2);
    ctx.textAlign = 'right';
    ctx.fillText(labelAway || '客隊', W - pad.r - 2, pad.t + iH - 2);
    ctx.textAlign = 'left';
  }, [data, labelHome, labelAway]);
  return (
    <canvas ref={canvasRef} width={400} height={120}
      style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }} />
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, children, accent = '#0066FF' }) {
  return (
    <Box sx={{
      background: 'rgba(10,22,40,0.7)',
      border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 2, p: 2,
    }}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <Box sx={{
          width: 28, height: 28, borderRadius: '8px',
          background: `${accent}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 16, color: accent } })}
        </Box>
        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

// ─── Live Dot Badge ──────────────────────────────────────────────────────────
function LiveBadge() {
  return (
    <Box display="flex" alignItems="center" gap={0.8}
      sx={{ background: 'rgba(244,59,48,0.12)', border: '1px solid rgba(244,59,48,0.3)', borderRadius: 2, px: 1.2, py: 0.3 }}>
      <Box sx={{
        width: 7, height: 7, borderRadius: '50%', background: '#F43B30',
        animation: `${liveBlink} 1.4s ease-in-out infinite`,
      }} />
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#F43B30', letterSpacing: '0.1em' }}>
        LIVE
      </Typography>
    </Box>
  );
}

// ─── Loading / Connecting View ───────────────────────────────────────────────
function ConnectingView({ status }) {
  const label = status === 'loading'
    ? '載入 AI 模型中...'
    : status === 'connecting'
    ? '正在連線分析引擎...'
    : 'AI 即時分析啟動中...';

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center"
      sx={{ height: 220, gap: 2 }}>
      <Box sx={{
        width: 64, height: 64, borderRadius: '50%',
        border: '2px solid rgba(0,102,255,0.25)',
        background: 'radial-gradient(circle, rgba(0,102,255,0.08) 0%, transparent 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: `${pulse} 2s ease-in-out infinite`,
      }}>
        <SportsSoccerIcon sx={{ fontSize: 28, color: '#0066FF' }} />
      </Box>
      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{label}</Typography>
      <LinearProgress sx={{
        width: 200, height: 3, borderRadius: 2,
        '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #0066FF, #00D4FF)' },
      }} />
    </Box>
  );
}

// ─── Live Stats Panel ────────────────────────────────────────────────────────
function LiveStats({ stats }) {
  const {
    home_poss = 50, away_poss = 50,
    danger = 0, players = 0,
    home_pressure = 50, away_pressure = 50,
    momentum = [], heatmap_b64, radar_b64,
    label_home = '主隊', label_away = '客隊',
    frame_num = 0,
  } = stats;

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>

      {/* Danger Index */}
      <StatCard icon={<WhatshotIcon />} label="危險指數" accent="#F43B30">
        <Box sx={{ animation: `${pulse} 2.5s ease-in-out infinite` }}>
          <DangerGauge value={danger} />
        </Box>
      </StatCard>

      {/* Possession */}
      <StatCard icon={<SportsSoccerIcon />} label="控球率" accent="#0066FF">
        <Box display="flex" justifyContent="space-between" mb={0.8}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2 }}>
              <AnimCounter target={home_poss} suffix="%" />
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>{label_home}</Typography>
          </Box>
          <Box textAlign="right">
            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2, color: '#00D4FF' }}>
              <AnimCounter target={away_poss} suffix="%" />
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>{label_away}</Typography>
          </Box>
        </Box>
        <Box sx={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <Box sx={{
            height: '100%', width: `${home_poss}%`,
            background: 'linear-gradient(90deg, #0066FF, #003399)',
            borderRadius: 4, transition: 'width 1s ease',
          }} />
        </Box>
      </StatCard>

      {/* Players + Pressure */}
      <Box display="flex" gap={1.5}>
        <StatCard icon={<PeopleIcon />} label="球員追蹤" accent="#00C853">
          <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: '#00C853', lineHeight: 1 }}>
            <AnimCounter target={players} />
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>/ 22 人</Typography>
        </StatCard>

        <StatCard icon={<ThermostatIcon />} label="壓迫指數" accent="#FFB300">
          <Box>
            <Box display="flex" justifyContent="space-between" mb={0.3}>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{label_home}</Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#FFB300' }}>
                <AnimCounter target={home_pressure} suffix="%" />
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={home_pressure}
              sx={{ mb: 1, height: 3, '& .MuiLinearProgress-bar': { background: '#FFB300', transition: 'transform 0.8s ease' } }} />
            <Box display="flex" justifyContent="space-between" mb={0.3}>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{label_away}</Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#00D4FF' }}>
                <AnimCounter target={away_pressure} suffix="%" />
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={away_pressure}
              sx={{ height: 3, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#00D4FF,#0066FF)', transition: 'transform 0.8s ease' } }} />
          </Box>
        </StatCard>
      </Box>

      {/* Momentum */}
      <StatCard icon={<AutoGraphIcon />} label="動量曲線" accent="#00D4FF">
        <MomentumChart data={momentum} labelHome={label_home} labelAway={label_away} />
        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', mt: 0.4 }}>
          主隊控場佔比隨時間
        </Typography>
      </StatCard>

      {/* Heatmap (mplsoccer Base64) */}
      {heatmap_b64 && (
        <StatCard icon={<ThermostatIcon />} label="球員熱力圖" accent="#F43B30">
          <Box sx={{ borderRadius: 1.5, overflow: 'hidden', lineHeight: 0 }}>
            <img
              src={`data:image/png;base64,${heatmap_b64}`}
              alt="heatmap"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </Box>
          <Box display="flex" justifyContent="space-between" mt={0.5}>
            <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>← {label_home} 攻</Typography>
            <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>{label_away} 攻 →</Typography>
          </Box>
        </StatCard>
      )}

      {/* Radar (mplsoccer Base64) */}
      {radar_b64 && (
        <StatCard icon={<RadarIcon />} label="球員陣型圖" accent="#A50044">
          <Box sx={{ borderRadius: 1.5, overflow: 'hidden', lineHeight: 0 }}>
            <img
              src={`data:image/png;base64,${radar_b64}`}
              alt="radar"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </Box>
          <Box display="flex" gap={1.5} mt={0.6} justifyContent="center">
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
              <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>{label_home}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#A50044' }} />
              <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>{label_away}</Typography>
            </Box>
          </Box>
        </StatCard>
      )}

      {/* Frame counter */}
      <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.18)', textAlign: 'right' }}>
        已分析 {frame_num} 幀
      </Typography>
    </Box>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LiveAnalysis() {
  const [url, setUrl]           = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [stats, setStats]       = useState(null);
  const [copied, setCopied]     = useState(false);
  const pollRef                 = useRef(null);

  // Extract YouTube video ID from URL
  const getVideoId = useCallback((u) =>
    (u || url).match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1], [url]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // Stop session on backend
  const stopSession = useCallback(async (sid) => {
    if (!sid) return;
    try { await apiFetch(`/api/stream/${sid}`, { method: 'DELETE' }); } catch (_) {}
  }, []);

  // Poll stats every POLL_MS
  useEffect(() => {
    if (!sessionId) return;
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/stream/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        setStats(data);
        if (data.status === 'ended') stopPolling();
      } catch (_) {}
    }, POLL_MS);
    return stopPolling;
  }, [sessionId, stopPolling]);

  const handleStart = async (targetUrl) => {
    const finalUrl = (targetUrl || url).trim();
    if (!finalUrl) return;
    setUrl(finalUrl);

    // Stop previous session
    if (sessionId) await stopSession(sessionId);
    setSessionId(null);
    setStats(null);

    try {
      const res = await apiFetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl }),
      });
      if (!res.ok) { alert('無法連線後端，請確認後端已啟動'); return; }
      const data = await res.json();
      setSessionId(data.session_id);
      setStats({ status: 'connecting' });
    } catch (_) {
      alert('無法連線後端，請確認後端已啟動');
    }
  };

  const handleStop = async () => {
    stopPolling();
    await stopSession(sessionId);
    setSessionId(null);
    setStats(null);
    setUrl('');
  };

  const isConnecting = stats && ['connecting', 'loading'].includes(stats.status);
  const isLive       = stats && stats.status === 'analyzing';
  const hasSession   = !!sessionId;
  const videoId      = getVideoId(url);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>

      {/* Header */}
      <Box mb={3} sx={{ animation: `${fadeUp} 0.5s ease` }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={0.5} flexWrap="wrap">
          <SportsSoccerIcon sx={{ color: '#0066FF', fontSize: 26 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            賽事即時 AI 分析
          </Typography>
          {isLive && <LiveBadge />}
          <Chip
            label="World Cup 2026"
            size="small"
            sx={{
              background: 'linear-gradient(90deg, #C9A227, #FFD700)',
              color: '#0A0A0A', fontWeight: 800, fontSize: '0.65rem',
              letterSpacing: '0.05em', ml: 'auto',
            }}
          />
        </Box>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
          輸入足球比賽 YouTube 網址，AI 即時追蹤球員、計算壓迫指數、動態更新熱力圖
        </Typography>
      </Box>

      {/* URL Input Bar — always visible */}
      <Box sx={{
        background: '#141F2E',
        border: `1px solid ${hasSession ? 'rgba(0,102,255,0.35)' : 'rgba(0,102,255,0.18)'}`,
        borderRadius: 2.5, p: 2, mb: 3,
        animation: hasSession ? `${glow} 3s ease-in-out infinite` : 'none',
      }}>
        <Box display="flex" gap={1.5} flexDirection={{ xs: 'column', sm: 'row' }}>
          <TextField
            fullWidth
            placeholder="貼上 YouTube 網址，例如 https://youtu.be/..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !hasSession && handleStart()}
            disabled={hasSession}
            size="small"
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ mr: 1, color: 'rgba(255,255,255,0.25)', display: 'flex' }}>
                  <PlayArrowIcon sx={{ fontSize: 18 }} />
                </Box>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                '& fieldset': { borderColor: 'rgba(0,102,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(0,102,255,0.45)' },
              },
            }}
          />
          {!hasSession ? (
            <Button
              variant="contained"
              onClick={() => handleStart()}
              disabled={!url.trim()}
              sx={{ px: 3, whiteSpace: 'nowrap', flexShrink: 0, minWidth: { xs: '100%', sm: 130 } }}
            >
              開始分析
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleStop}
              sx={{ px: 3, whiteSpace: 'nowrap', flexShrink: 0, minWidth: { xs: '100%', sm: 130 } }}
            >
              停止
            </Button>
          )}
        </Box>

        {/* Demo shortcut + feature pills */}
        {!hasSession && (
          <>
            <Box display="flex" alignItems="center" gap={1.5} mt={1.5} flexWrap="wrap">
              <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.28)' }}>快速示範：</Typography>
              <Button
                size="small" variant="outlined"
                onClick={() => handleStart(DEMO_URL)}
                sx={{
                  fontSize: '0.75rem', py: 0.4, px: 1.5,
                  borderColor: 'rgba(255,183,0,0.3)', color: '#FFB300',
                  '&:hover': { borderColor: '#FFB300', background: 'rgba(255,183,0,0.06)' },
                }}
              >
                ⚽ 皇馬 vs 巴薩 Supercopa 2025 (2-5)
              </Button>
              <Tooltip title={copied ? '已複製！' : '複製網址'} placement="top">
                <IconButton size="small" onClick={() => { navigator.clipboard.writeText(DEMO_URL); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                  {copied
                    ? <CheckIcon sx={{ fontSize: 14, color: '#00C853' }} />
                    : <ContentCopyIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.22)' }} />}
                </IconButton>
              </Tooltip>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box display="flex" gap={1} flexWrap="wrap">
              {['YOLOv8 球員偵測', 'ByteTrack 多目標追蹤', '壓迫熱力圖', '動量曲線', '即時危險指數'].map(f => (
                <Chip key={f} label={f} size="small"
                  sx={{ fontSize: '0.68rem', background: 'rgba(0,102,255,0.07)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,102,255,0.13)' }} />
              ))}
            </Box>
          </>
        )}
      </Box>

      {/* Main Content: video + stats side by side */}
      {hasSession && (
        <Grid container spacing={2.5} sx={{ animation: `${fadeUp} 0.4s ease` }}>

          {/* Left: YouTube embed */}
          <Grid item xs={12} md={7}>
            <Box sx={{
              borderRadius: 2, overflow: 'hidden',
              border: '1px solid rgba(0,102,255,0.2)',
              background: '#000', aspectRatio: '16/9',
              position: 'relative',
            }}>
              {videoId ? (
                <iframe
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  style={{ border: 'none', display: 'block', position: 'absolute', inset: 0 }}
                  title="match-video"
                />
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)' }}>無法載入影片</Typography>
                </Box>
              )}
            </Box>

            {/* Under video: live status */}
            <Box display="flex" alignItems="center" gap={1} mt={1} flexWrap="wrap">
              {isLive && <LiveBadge />}
              {isConnecting && (
                <Chip size="small" label="AI 啟動中..."
                  sx={{ fontSize: '0.68rem', background: 'rgba(0,102,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }} />
              )}
              {stats?.frame_num > 0 && (
                <Chip size="small" label={`${stats.frame_num} 幀`}
                  sx={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }} />
              )}
              <Chip size="small" label="示範模式"
                sx={{ fontSize: '0.68rem', background: 'rgba(255,183,0,0.08)', color: '#FFB300', border: '1px solid rgba(255,183,0,0.18)' }} />
            </Box>

            {/* Disclaimer */}
            <Box sx={{
              mt: 2, p: 1.5, borderRadius: 1.5,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                ⚠ 本分析工具僅供娛樂參考，AI 視覺數據不代表任何投注建議。請理性投注。
              </Typography>
            </Box>
          </Grid>

          {/* Right: live stats */}
          <Grid item xs={12} md={5}>
            {isConnecting
              ? <ConnectingView status={stats?.status} />
              : isLive || stats?.status === 'ended'
                ? <LiveStats stats={stats} />
                : null}
          </Grid>

        </Grid>
      )}

    </Box>
  );
}
