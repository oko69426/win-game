import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Grid, Divider } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import VerifiedIcon from '@mui/icons-material/Verified';
import BarChartIcon from '@mui/icons-material/BarChart';
import StorageIcon from '@mui/icons-material/Storage';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/* ── Circular Progress Ring ── */
function CircleProgress({ percent, size = 120, color = '#0066FF', label, sublabel }) {
  const r = (size - 18) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1800, 1);
        setAnimated((1 - Math.pow(1 - p, 3)) * percent);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [percent]);

  const dash = (animated / 100) * circ;

  return (
    <Box ref={ref} display="flex" flexDirection="column" alignItems="center" gap={1.5}>
      <Box position="relative" width={size} height={size}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={9}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={9}
            strokeDasharray={circ}
            strokeDashoffset={circ - dash}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          />
        </svg>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          sx={{ transform: 'translate(-50%,-50%)', textAlign: 'center' }}
        >
          <Typography fontWeight={900} sx={{ color, fontSize: '1.2rem', lineHeight: 1 }}>
            {Math.round(animated)}%
          </Typography>
        </Box>
      </Box>
      <Box textAlign="center">
        <Typography variant="body2" fontWeight={700} color="white">{label}</Typography>
        {sublabel && (
          <Typography variant="caption" color="text.secondary">{sublabel}</Typography>
        )}
      </Box>
    </Box>
  );
}

/* ── League data ── */
const leagueData = [
  { label: '英超', sublabel: 'English Premier League', percent: 74, color: '#0066FF',  total: 842, hit: 623, miss: 219 },
  { label: '德甲', sublabel: 'Bundesliga',              percent: 72, color: '#00C853',  total: 718, hit: 517, miss: 201 },
  { label: '西甲', sublabel: 'La Liga',                 percent: 71, color: '#00D4FF',  total: 694, hit: 493, miss: 201 },
  { label: 'MLB',  sublabel: 'Major League Baseball',   percent: 64, color: '#FFB300',  total: 512, hit: 328, miss: 184 },
  { label: '義甲', sublabel: 'Serie A',                 percent: 69, color: '#FF6B9D',  total: 623, hit: 430, miss: 193 },
  { label: '法甲', sublabel: 'Ligue 1',                 percent: 68, color: '#A855F7',  total: 458, hit: 311, miss: 147 },
];

/* ── Summary cards ── */
const summaryCards = [
  {
    icon: <VerifiedIcon />,
    label: '整體準確率',
    value: '71.8%',
    color: '#0066FF',
    sub: 'Overall Accuracy',
  },
  {
    icon: <AnalyticsIcon />,
    label: '訓練數據規模',
    value: '15萬+',
    color: '#00C853',
    sub: 'Training Matches',
  },
  {
    icon: <SportsSoccerIcon />,
    label: '最佳聯賽 EPL',
    value: '74.1%',
    color: '#00D4FF',
    sub: 'Best League',
  },
  {
    icon: <TrendingUpIcon />,
    label: '高信心場次 ROI',
    value: '+8.7%',
    color: '#FFB300',
    sub: 'High Confidence ROI',
  },
];

/* ── Model spec cards ── */
const modelSpecs = [
  { icon: <PsychologyIcon sx={{ fontSize: 22 }} />,  title: '演算法',   value: 'AI 深度學習模型',  color: '#0066FF' },
  { icon: <BarChartIcon sx={{ fontSize: 22 }} />,    title: '特徵維度', value: '1,500+ 資料點',    color: '#00C853' },
  { icon: <StorageIcon sx={{ fontSize: 22 }} />,     title: '訓練數據', value: '15萬+ 場',         color: '#00D4FF' },
  { icon: <VerifiedIcon sx={{ fontSize: 22 }} />,    title: '整體準確率', value: '71%+',           color: '#FFB300' },
];

/* ── Bar chart ── */
const monthlyAccuracy = [64, 68, 71, 67, 70, 73, 69, 72, 68, 71, 70, 74];
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const barChartData = {
  labels: months,
  datasets: [
    {
      label: '月度命中率 (%)',
      data: monthlyAccuracy,
      backgroundColor: 'rgba(0,102,255,0.7)',
      borderColor: '#0066FF',
      borderWidth: 1.5,
      borderRadius: 4,
    },
  ],
};

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      labels: { color: 'rgba(255,255,255,0.7)', font: { size: 12 } },
    },
    title: { display: false },
    tooltip: {
      backgroundColor: '#1a1a1a',
      titleColor: '#0066FF',
      bodyColor: 'rgba(255,255,255,0.8)',
      borderColor: 'rgba(0,102,255,0.3)',
      borderWidth: 1,
      callbacks: {
        label: (ctx) => ` ${ctx.raw}%`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.06)' },
      ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } },
    },
    y: {
      min: 60,
      max: 82,
      grid: { color: 'rgba(255,255,255,0.08)' },
      ticks: {
        color: 'rgba(255,255,255,0.6)',
        font: { size: 11 },
        callback: (v) => `${v}%`,
      },
    },
  },
};

/* ════════════════════════════════════════════════════════ */
export default function Performance() {
  return (
    <Box sx={{ color: 'white', px: { xs: 2, md: 0 } }}>

      {/* ── Page Header ── */}
      <Box py={8}>
        <Typography
          variant="overline"
          sx={{
            color: '#0066FF',
            letterSpacing: 4,
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'block',
            mb: 1,
          }}
        >
          MODEL PERFORMANCE
        </Typography>
        <Typography
          variant="h4"
          fontWeight={900}
          sx={{
            mb: 2,
            background: 'linear-gradient(90deg, #0066FF, #00D4FF 60%, #00C853)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          預測績效報告
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
          基於歷史回測數據，展示各聯賽預測模型的命中率、準確率及投資回報率分析。
          所有數據均來自過去 12 個月的實際預測結果。
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ── Summary Stat Cards ── */}
      <Box py={8}>
        <Grid container spacing={2}>
          {summaryCards.map((card) => (
            <Grid item xs={6} md={3} key={card.label}>
              <Box
                sx={{
                  background: '#141F2E',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  transition: 'box-shadow 0.3s, border-color 0.3s',
                  '&:hover': {
                    boxShadow: `0 0 20px ${card.color}33`,
                    borderColor: `${card.color}55`,
                  },
                }}
              >
                <Box mb={1} sx={{ color: card.color, display: 'flex', justifyContent: 'center' }}>
                  {React.cloneElement(card.icon, { sx: { fontSize: 28, color: card.color } })}
                </Box>
                <Typography
                  fontWeight={900}
                  sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, color: card.color, lineHeight: 1, mb: 0.5 }}
                >
                  {card.value}
                </Typography>
                <Typography variant="body2" fontWeight={700} color="white" mb={0.25}>
                  {card.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.sub}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ── Circular Progress Rings — 各聯賽準確率 ── */}
      <Box py={8}>
        <Typography
          variant="overline"
          sx={{ color: '#0066FF', letterSpacing: 3, fontSize: '0.7rem', fontWeight: 700, display: 'block', mb: 1 }}
        >
          LEAGUE ACCURACY
        </Typography>
        <Typography variant="h5" fontWeight={800} mb={4}>
          各聯賽準確率
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {leagueData.map((league) => (
            <Grid
              item
              xs={6} sm={4} md={2}
              key={league.label}
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <Box sx={{ transform: { xs: 'scale(0.82)', sm: 'scale(1)' }, transformOrigin: 'top center' }}>
              <CircleProgress
                percent={league.percent}
                size={120}
                color={league.color}
                label={league.label}
                sublabel={league.sublabel}
              />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ── Monthly Bar Chart — 月度命中率趨勢 ── */}
      <Box py={8}>
        <Typography
          variant="overline"
          sx={{ color: '#0066FF', letterSpacing: 3, fontSize: '0.7rem', fontWeight: 700, display: 'block', mb: 1 }}
        >
          MONTHLY TREND
        </Typography>
        <Typography variant="h5" fontWeight={800} mb={4}>
          月度命中率趨勢
        </Typography>
        <Box
          sx={{
            background: '#141F2E',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
            p: 3,
          }}
        >
          <Bar data={barChartData} options={barChartOptions} />
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ── Prediction Breakdown Table — 預測分佈分析 ── */}
      <Box py={8}>
        <Typography
          variant="overline"
          sx={{ color: '#0066FF', letterSpacing: 3, fontSize: '0.7rem', fontWeight: 700, display: 'block', mb: 1 }}
        >
          PREDICTION DISTRIBUTION
        </Typography>
        <Typography variant="h5" fontWeight={800} mb={4}>
          預測分佈分析
        </Typography>
        <Box
          sx={{
            background: '#141F2E',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* Header row */}
          <Grid
            container
            sx={{
              px: 3,
              py: 1.5,
              background: 'rgba(0,102,255,0.07)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {[
              { label: '聯賽',  xs: 3 },
              { label: '總預測', xs: 2 },
              { label: '命中',  xs: 2 },
              { label: '未中',  xs: 2 },
              { label: '準確率', xs: 3 },
            ].map((col) => (
              <Grid item xs={col.xs} key={col.label}>
                <Typography
                  variant="caption"
                  sx={{ color: '#0066FF', fontWeight: 800, letterSpacing: 1, fontSize: '0.72rem' }}
                >
                  {col.label}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Data rows */}
          {leagueData.map((row, idx) => (
            <Grid
              container
              key={row.label}
              alignItems="center"
              sx={{
                px: 3,
                py: 2,
                background: idx % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderBottom: idx < leagueData.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                '&:hover': { background: 'rgba(0,102,255,0.04)' },
                transition: 'background 0.2s',
              }}
            >
              {/* League name */}
              <Grid item xs={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: row.color,
                      boxShadow: `0 0 6px ${row.color}`,
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="white">
                      {row.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: { xs: 'none', sm: 'block' } }}>
                      {row.sublabel}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Total */}
              <Grid item xs={2}>
                <Typography variant="body2" color="rgba(255,255,255,0.7)">{row.total}</Typography>
              </Grid>

              {/* Hit */}
              <Grid item xs={2}>
                <Typography variant="body2" sx={{ color: '#0066FF', fontWeight: 600 }}>{row.hit}</Typography>
              </Grid>

              {/* Miss */}
              <Grid item xs={2}>
                <Typography variant="body2" sx={{ color: '#FF6B6B', fontWeight: 600 }}>{row.miss}</Typography>
              </Grid>

              {/* Accuracy bar */}
              <Grid item xs={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      flex: 1,
                      height: 6,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${row.percent}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${row.color}99, ${row.color})`,
                        borderRadius: 3,
                        boxShadow: `0 0 8px ${row.color}66`,
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: row.color, fontWeight: 800, minWidth: 38, fontSize: '0.78rem' }}
                  >
                    {row.percent}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          ))}
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ── Model Spec Cards — 模型規格 ── */}
      <Box py={8}>
        <Typography
          variant="overline"
          sx={{ color: '#0066FF', letterSpacing: 3, fontSize: '0.7rem', fontWeight: 700, display: 'block', mb: 1 }}
        >
          MODEL SPECIFICATIONS
        </Typography>
        <Typography variant="h5" fontWeight={800} mb={4}>
          模型規格
        </Typography>
        <Grid container spacing={2}>
          {modelSpecs.map((spec) => (
            <Grid item xs={12} sm={6} key={spec.title}>
              <Box
                sx={{
                  background: '#141F2E',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: `4px solid ${spec.color}`,
                  borderRadius: 2,
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  transition: 'box-shadow 0.3s',
                  '&:hover': {
                    boxShadow: `0 0 16px ${spec.color}22`,
                  },
                }}
              >
                <Box sx={{ color: spec.color, display: 'flex', alignItems: 'center' }}>
                  {spec.icon}
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ letterSpacing: 1, fontSize: '0.68rem', textTransform: 'uppercase', display: 'block', mb: 0.25 }}
                  >
                    {spec.title}
                  </Typography>
                  <Typography variant="body1" fontWeight={800} color="white">
                    {spec.value}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ── Disclaimer ── */}
      <Box py={6} textAlign="center">
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: '0.72rem', lineHeight: 1.8, maxWidth: 600, display: 'block', mx: 'auto' }}
        >
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, verticalAlign: 'middle', mr: 0.5 }}>
            <WarningAmberIcon sx={{ fontSize: 14, color: '#FFB300' }} />
          </Box>
          免責聲明：以上所有績效數據均基於歷史回測結果，過去的預測表現不代表未來收益保證。
          體育比賽存在不可預測因素，請理性參考數據，並對個人投資決策負責。
        </Typography>
      </Box>

    </Box>
  );
}
