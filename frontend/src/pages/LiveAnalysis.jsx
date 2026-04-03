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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { apiFetch } from '../services/api';

// ─── Animations ────────────────────────────────────────────────────────────
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(244,59,48,0.5); }
  50%       { box-shadow: 0 0 0 14px rgba(244,59,48,0); }
`;
const scanLine = keyframes`
  0%   { transform: translateY(-100%); opacity: 0.7; }
  100% { transform: translateY(400%);  opacity: 0; }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const glow = keyframes`
  0%, 100% { border-color: rgba(0,102,255,0.4); box-shadow: 0 0 0 0 rgba(0,102,255,0); }
  50%       { border-color: rgba(0,212,255,0.8); box-shadow: 0 0 18px rgba(0,212,255,0.25); }
`;
const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const DEMO_URL = 'https://youtu.be/YsWzugAnsBw';
const POLL_MS  = 1500;

// ─── Heatmap Canvas ────────────────────────────────────────────────────────
function Heatmap({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rows = data.length;
    const cols = data[0]?.length || 0;
    const cw = canvas.width / cols;
    const ch = canvas.height / rows;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Field green base
    ctx.fillStyle = '#0d2a0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Field lines
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 4, canvas.width - 16, canvas.height - 8);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 4);
    ctx.lineTo(canvas.width / 2, canvas.height - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 28, 0, Math.PI * 2);
    ctx.stroke();

    // Heatmap overlay
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = data[r][c];
        if (v < 0.05) continue;
        const alpha = v * 0.75;
        // Blue → Yellow → Red gradient
        let R, G, B;
        if (v < 0.5) {
          R = 0; G = Math.round(v * 2 * 200); B = 255;
        } else {
          const t = (v - 0.5) * 2;
          R = Math.round(t * 244); G = Math.round(200 * (1 - t) + 183 * t); B = Math.round(255 * (1 - t));
        }
        ctx.fillStyle = `rgba(${R},${G},${B},${alpha})`;
        ctx.fillRect(c * cw, r * ch, cw + 0.5, ch + 0.5);
      }
    }
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={200}
      style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
    />
  );
}

// ─── Momentum Line ─────────────────────────────────────────────────────────
function MomentumChart({ data, labelHome, labelAway }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data?.length || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { t: 8, b: 24, l: 8, r: 8 };
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, W, H);

    // 50% line
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    const midY = pad.t + iH / 2;
    ctx.beginPath(); ctx.moveTo(pad.l, midY); ctx.lineTo(W - pad.r, midY); ctx.stroke();
    ctx.setLineDash([]);

    // Fill area
    const pts = data.map((v, i) => ({
      x: pad.l + (i / (data.length - 1)) * iW,
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
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#00D4FF';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(labelHome || '主隊', pad.l + 2, pad.t + iH - 2);
    ctx.textAlign = 'right';
    ctx.fillText(labelAway || '客隊', W - pad.r - 2, pad.t + iH - 2);
    ctx.textAlign = 'left';
  }, [data, labelHome, labelAway]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={120}
      style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
    />
  );
}

// ─── Animated Counter ──────────────────────────────────────────────────────
function AnimCounter({ target, suffix = '', duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.round(start));
      if (start >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return <>{val}{suffix}</>;
}

// ─── Danger Gauge (SVG Arc) ────────────────────────────────────────────────
function DangerGauge({ value }) {
  const r = 42, cx = 56, cy = 56;
  const circ = Math.PI * r; // half circle
  const arc = (value / 100) * circ;
  const color = value >= 75 ? '#F43B30' : value >= 50 ? '#FFB300' : '#00C853';

  return (
    <Box sx={{ position: 'relative', width: 112, height: 72, mx: 'auto' }}>
      <svg width="112" height="72" viewBox="0 0 112 72">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circ}`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <Box sx={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center',
      }}>
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

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, children, delay = 0, accent = '#0066FF' }) {
  return (
    <Box sx={{
      background: '#141F2E',
      border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 2,
      p: 2,
      animation: `${fadeUp} 0.5s ease forwards`,
      animationDelay: `${delay}ms`,
      opacity: 0,
    }}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <Box sx={{
          width: 28, height: 28, borderRadius: '8px',
          background: `${accent}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 16, color: accent } })}
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

// ─── Processing Stage List ─────────────────────────────────────────────────
const STAGES = [
  '正在取得比賽影片...',
  'AI 偵測球員中 (YOLOv8)...',
  'ByteTrack 追蹤軌跡...',
  '計算壓迫區域與熱力圖...',
  '生成 AI 分析報告...',
];

function ProcessingView({ stage, progress }) {
  const currentIdx = STAGES.findIndex(s => stage.startsWith(s.slice(0, 8)));

  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      {/* Scanning animation */}
      <Box sx={{
        width: 100, height: 100, borderRadius: '50%', mx: 'auto', mb: 4,
        border: '2px solid rgba(0,102,255,0.3)',
        background: 'radial-gradient(circle, rgba(0,102,255,0.08) 0%, transparent 70%)',
        position: 'relative', overflow: 'hidden',
        animation: `${pulse} 2s ease-in-out infinite`,
      }}>
        <SportsSoccerIcon sx={{
          fontSize: 36, color: '#0066FF',
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }} />
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '30%',
          background: 'linear-gradient(to bottom, rgba(0,212,255,0.3), transparent)',
          animation: `${scanLine} 2s linear infinite`,
        }} />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        AI 正在分析賽況
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', mb: 4, minHeight: 20 }}>
        {stage}
      </Typography>

      {/* Stage list */}
      <Box sx={{ maxWidth: 360, mx: 'auto', mb: 4, textAlign: 'left' }}>
        {STAGES.map((s, i) => {
          const done = currentIdx > i;
          const active = currentIdx === i || (currentIdx === -1 && i === 0);
          return (
            <Box key={i} display="flex" alignItems="center" gap={1.5} mb={1}>
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: done ? 'none' : active ? '2px solid #0066FF' : '2px solid rgba(255,255,255,0.12)',
                background: done ? '#00C853' : active ? 'rgba(0,102,255,0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done
                  ? <CheckIcon sx={{ fontSize: 12, color: '#fff' }} />
                  : active
                    ? <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#0066FF', animation: `${spin} 1s linear infinite` }} />
                    : null}
              </Box>
              <Typography sx={{
                fontSize: '0.82rem',
                color: done ? '#00C853' : active ? '#fff' : 'rgba(255,255,255,0.3)',
                fontWeight: active ? 600 : 400,
              }}>
                {s.replace('...', '')}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ maxWidth: 360, mx: 'auto' }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 4, borderRadius: 2,
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #0066FF, #00D4FF)',
            },
          }}
        />
        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', mt: 0.8, textAlign: 'right' }}>
          {progress}%
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Results View ──────────────────────────────────────────────────────────
function ResultsView({ result }) {
  const {
    youtube_url, video_clip_url,
    total_players_tracked, home_possession, away_possession,
    danger_index, home_pressure, away_pressure, heatmap, momentum,
    frames_analyzed, model, demo_mode,
    label_home = '主隊', label_away = '客隊',
  } = result;

  const [videoTab, setVideoTab] = useState(0);
  const videoId = youtube_url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];

  return (
    <Box>
      {/* Embed + Stats Grid */}
      <Grid container spacing={2.5}>
        {/* Video */}
        <Grid item xs={12} md={6}>
          {/* Tab switcher: Original / AI Annotated */}
          {video_clip_url && (
            <Box display="flex" gap={1} mb={1}>
              {['原始比賽', 'AI 標注版'].map((tab, i) => (
                <Button
                  key={i}
                  size="small"
                  variant={videoTab === i ? 'contained' : 'outlined'}
                  onClick={() => setVideoTab(i)}
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 1.5, minWidth: 0 }}
                >
                  {tab}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{
            borderRadius: 2, overflow: 'hidden',
            border: '1px solid rgba(0,102,255,0.2)',
            background: '#000',
            aspectRatio: '16/9',
            animation: `${fadeUp} 0.4s ease forwards`,
          }}>
            {videoTab === 0 && videoId ? (
              <iframe
                width="100%" height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{ border: 'none', display: 'block' }}
                title="match-video"
              />
            ) : videoTab === 1 && video_clip_url ? (
              <video
                key={video_clip_url}
                width="100%" height="100%"
                controls autoPlay muted loop
                style={{ display: 'block', objectFit: 'contain' }}
              >
                <source src={`${process.env.REACT_APP_API_URL || ''}${video_clip_url}`} type="video/mp4" />
              </video>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <Typography sx={{ color: 'rgba(255,255,255,0.3)' }}>影片無法載入</Typography>
              </Box>
            )}
          </Box>

          {/* Under video: model badge */}
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <Chip
              size="small"
              label={model}
              sx={{ fontSize: '0.68rem', background: 'rgba(0,102,255,0.12)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}
            />
            <Chip
              size="small"
              label={`${frames_analyzed} 幀已分析`}
              sx={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}
            />
            {demo_mode && (
              <Chip size="small" label="示範模式" sx={{ fontSize: '0.68rem', background: 'rgba(255,183,0,0.1)', color: '#FFB300', border: '1px solid rgba(255,183,0,0.2)' }} />
            )}
          </Box>
        </Grid>

        {/* Stats */}
        <Grid item xs={12} md={6}>
          <Box display="flex" flexDirection="column" gap={2}>

            {/* Danger Index */}
            <StatCard icon={<WhatshotIcon />} label="危險指數" delay={100} accent="#F43B30">
              <Box sx={{ animation: `${pulse} 2.5s ease-in-out infinite` }}>
                <DangerGauge value={danger_index} />
              </Box>
            </StatCard>

            {/* Possession */}
            <StatCard icon={<SportsSoccerIcon />} label="控球率" delay={200} accent="#0066FF">
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.3rem' }}>
                    <AnimCounter target={home_possession} suffix="%" />
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{label_home}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#00D4FF' }}>
                    <AnimCounter target={away_possession} suffix="%" />
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{label_away}</Typography>
                </Box>
              </Box>
              <Box sx={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <Box sx={{
                  height: '100%',
                  width: `${home_possession}%`,
                  background: 'linear-gradient(90deg, #0066FF, #003399)',
                  borderRadius: 4,
                  transition: 'width 1.2s ease',
                }} />
              </Box>
            </StatCard>

            {/* Player tracking */}
            <StatCard icon={<PeopleIcon />} label="球員追蹤" delay={300} accent="#00C853">
              <Box display="flex" alignItems="baseline" gap={1}>
                <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#00C853', lineHeight: 1 }}>
                  <AnimCounter target={total_players_tracked} duration={800} />
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>
                  / 22 名球員
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(total_players_tracked / 22) * 100}
                sx={{
                  mt: 1, height: 4,
                  '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #00C853, #00E676)' },
                }}
              />
            </StatCard>

          </Box>
        </Grid>
      </Grid>

      {/* Second row: Pressure + Heatmap + Momentum */}
      <Grid container spacing={2.5} mt={0}>

        {/* Pressure */}
        <Grid item xs={12} sm={4}>
          <StatCard icon={<ThermostatIcon />} label="壓迫指數" delay={400} accent="#FFB300">
            <Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{label_home}</Typography>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFB300' }}>
                  <AnimCounter target={home_pressure} suffix="%" />
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={home_pressure}
                sx={{ mb: 1.5, '& .MuiLinearProgress-bar': { background: '#FFB300' } }}
              />
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{label_away}</Typography>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#00D4FF' }}>
                  <AnimCounter target={away_pressure} suffix="%" />
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={away_pressure}
                sx={{ '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #00D4FF, #0066FF)' } }}
              />
            </Box>
          </StatCard>
        </Grid>

        {/* Heatmap */}
        <Grid item xs={12} sm={5}>
          <StatCard icon={<ThermostatIcon />} label="球員熱力圖" delay={500} accent="#F43B30">
            <Heatmap data={heatmap} />
            <Box display="flex" justifyContent="space-between" mt={0.8}>
              <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>← {label_home} 攻方</Typography>
              <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>{label_away} 攻方 →</Typography>
            </Box>
          </StatCard>
        </Grid>

        {/* Momentum */}
        <Grid item xs={12} sm={3}>
          <StatCard icon={<AutoGraphIcon />} label="動量曲線" delay={600} accent="#00D4FF">
            <MomentumChart data={momentum} labelHome={label_home} labelAway={label_away} />
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', mt: 0.5, textAlign: 'center' }}>
              主隊控場佔比隨時間變化
            </Typography>
          </StatCard>
        </Grid>

      </Grid>

      {/* Disclaimer */}
      <Box sx={{
        mt: 3, p: 2, borderRadius: 2,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
          ⚠ 本分析工具僅供娛樂參考，電腦視覺數據不代表任何投注建議。請理性投注。
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function LiveAnalysis() {
  const [url, setUrl]         = useState('');
  const [jobId, setJobId]     = useState(null);
  const [job, setJob]         = useState(null);
  const [copied, setCopied]   = useState(false);
  const pollRef               = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Poll job status
  useEffect(() => {
    if (!jobId) return;
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/live-analysis/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        setJob(data);
        if (data.status === 'complete' || data.status === 'error') stopPolling();
      } catch (_) {}
    }, POLL_MS);
    return stopPolling;
  }, [jobId, stopPolling]);

  const handleSubmit = async (targetUrl) => {
    const finalUrl = (targetUrl || url).trim();
    if (!finalUrl) return;
    setUrl(finalUrl);
    setJob(null);
    setJobId(null);
    try {
      const res = await apiFetch('/api/live-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl, duration: 45 }),
      });
      if (!res.ok) { alert('無法連線後端，請確認後端已啟動'); return; }
      const data = await res.json();
      setJobId(data.job_id);
      setJob({ status: 'queued', progress: 0, stage: '排隊中...' });
    } catch (_) {
      alert('無法連線後端，請確認後端已啟動');
    }
  };

  const isProcessing = job && job.status !== 'complete' && job.status !== 'error';
  const isDone       = job?.status === 'complete' && job?.result;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>

      {/* Header */}
      <Box mb={4} sx={{ animation: `${fadeUp} 0.5s ease` }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <SportsSoccerIcon sx={{ color: '#0066FF', fontSize: 28 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            賽事即時 AI 分析
          </Typography>
          <Chip
            label="世界盃 2026"
            size="small"
            sx={{
              background: 'linear-gradient(90deg, #C9A227, #FFD700)',
              color: '#0A0A0A', fontWeight: 800, fontSize: '0.68rem',
              letterSpacing: '0.05em',
            }}
          />
        </Box>
        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem' }}>
          輸入任何足球比賽 YouTube 網址，AI 即時追蹤球員、計算壓迫指數、生成熱力圖
        </Typography>
      </Box>

      {/* Input card */}
      {!isProcessing && !isDone && (
        <Box sx={{
          background: '#141F2E',
          border: '1px solid rgba(0,102,255,0.2)',
          borderRadius: 3, p: { xs: 2.5, md: 4 },
          animation: `${fadeUp} 0.5s ease`,
        }}>
          <Box display="flex" gap={1.5} flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              fullWidth
              placeholder="貼上 YouTube 網址，例如 https://youtu.be/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ mr: 1, color: 'rgba(255,255,255,0.25)', display: 'flex' }}>
                    <PlayArrowIcon sx={{ fontSize: 20 }} />
                  </Box>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': { borderColor: 'rgba(0,102,255,0.25)' },
                  '&:hover fieldset': { borderColor: 'rgba(0,102,255,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#0066FF' },
                  '&.Mui-focused': { animation: `${glow} 2s ease-in-out infinite` },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => handleSubmit()}
              disabled={!url.trim()}
              sx={{
                px: 4, py: 1.5, whiteSpace: 'nowrap', flexShrink: 0,
                minWidth: { xs: '100%', sm: 140 },
              }}
            >
              開始分析
            </Button>
          </Box>

          {/* Demo shortcut */}
          <Box display="flex" alignItems="center" gap={1.5} mt={2.5} flexWrap="wrap">
            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>快速示範：</Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleSubmit(DEMO_URL)}
              sx={{
                fontSize: '0.78rem', py: 0.5, px: 1.5,
                borderColor: 'rgba(255,183,0,0.3)', color: '#FFB300',
                '&:hover': { borderColor: '#FFB300', background: 'rgba(255,183,0,0.06)' },
              }}
            >
              ⚽ 皇馬 vs 巴薩 2-5 Supercopa 2025
            </Button>
            <Tooltip title={copied ? '已複製！' : '複製網址'} placement="top">
              <IconButton size="small" onClick={() => { navigator.clipboard.writeText(DEMO_URL); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? <CheckIcon sx={{ fontSize: 14, color: '#00C853' }} /> : <ContentCopyIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.25)' }} />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Feature pills */}
          <Divider sx={{ my: 3 }} />
          <Box display="flex" gap={1} flexWrap="wrap">
            {['YOLOv8 球員偵測', 'ByteTrack 多目標追蹤', '壓迫熱力圖', '動量曲線分析', '危險指數計算'].map(f => (
              <Chip key={f} label={f} size="small" sx={{ fontSize: '0.72rem', background: 'rgba(0,102,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,102,255,0.15)' }} />
            ))}
          </Box>
        </Box>
      )}

      {/* Processing */}
      {isProcessing && (
        <Box sx={{ background: '#141F2E', border: '1px solid rgba(0,102,255,0.2)', borderRadius: 3 }}>
          <ProcessingView stage={job.stage} progress={job.progress} />
        </Box>
      )}

      {/* Results */}
      {isDone && (
        <Box>
          {/* Back button */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
            <Button
              size="small" variant="outlined"
              onClick={() => { setJob(null); setJobId(null); setUrl(''); }}
              sx={{ fontSize: '0.8rem' }}
            >
              ← 分析新比賽
            </Button>
            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>
              {new URL(url).hostname} 比賽分析報告
            </Typography>
          </Box>
          <ResultsView result={job.result} />
        </Box>
      )}

    </Box>
  );
}
