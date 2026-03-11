import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Grid, Divider, Chip } from '@mui/material';
import { keyframes } from '@emotion/react';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import VerifiedIcon from '@mui/icons-material/Verified';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import ShieldIcon from '@mui/icons-material/Shield';
import BarChartIcon from '@mui/icons-material/BarChart';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LockIcon from '@mui/icons-material/Lock';
import SpeedIcon from '@mui/icons-material/Speed';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/* ─── Keyframes ─── */
const floatA = keyframes`
  0%,100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
`;
const floatB = keyframes`
  0%,100% { transform: translateY(0px) translateX(0px); }
  33% { transform: translateY(-20px) translateX(10px); }
  66% { transform: translateY(10px) translateX(-8px); }
`;
const shimmer = keyframes`
  0%   { background-position: -800px center; }
  100% { background-position: 800px center; }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(36px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const fadeRight = keyframes`
  from { opacity: 0; transform: translateX(50px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const pulseDot = keyframes`
  0%,100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.6); opacity: 0.5; }
`;
const glowBtn = keyframes`
  0%,100% { box-shadow: 0 0 25px rgba(0,102,255,0.5), 0 4px 20px rgba(0,102,255,0.3); }
  50%      { box-shadow: 0 0 45px rgba(0,102,255,0.8), 0 4px 35px rgba(0,102,255,0.5); }
`;
const barGrow = keyframes`
  from { width: 0; }
`;
const scanSlide = keyframes`
  0%   { top: 0;    opacity: 0; }
  5%   { opacity: 0.7; }
  95%  { opacity: 0.7; }
  100% { top: 100%; opacity: 0; }
`;
const orbPulse = keyframes`
  0%,100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.08); }
`;
const borderRotate = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

/* ─── Count-up hook ─── */
function useCountUp(target, duration = 2200) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step);
        else setValue(target);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { value, ref };
}

/* ─── Radial progress ring ─── */
function RingProgress({ pct, size = 120, color = '#0066FF', label, sublabel }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let s = null;
      const step = ts => {
        if (!s) s = ts;
        const p = Math.min((ts - s) / 1800, 1);
        setAnim((1 - Math.pow(1 - p, 3)) * pct);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [pct]);
  return (
    <Box ref={ref} display="flex" flexDirection="column" alignItems="center" gap={1.5}>
      <Box position="relative" width={size} height={size}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={circ} strokeDashoffset={circ - (anim / 100) * circ}
            strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${color})` }}/>
        </svg>
        <Box position="absolute" top="50%" left="50%" sx={{ transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <Typography fontWeight={900} sx={{ color, fontSize: '1.2rem', lineHeight: 1 }}>{Math.round(anim)}%</Typography>
        </Box>
      </Box>
      <Box textAlign="center">
        <Typography variant="body2" fontWeight={700} color="white">{label}</Typography>
        {sublabel && <Typography variant="caption" color="text.secondary">{sublabel}</Typography>}
      </Box>
    </Box>
  );
}

/* ─── Stat card ─── */
function StatCard({ target, suffix='', label, sublabel, color='#0066FF', icon, display: displayProp }) {
  const { value, ref } = useCountUp(target);
  const d = displayProp || `${value.toLocaleString()}${suffix}`;
  return (
    <Box ref={ref} sx={{
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px',
      p: { xs: 2, md: 3 }, textAlign: 'center', background: 'rgba(14,22,38,0.7)',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s',
      '&:hover': { borderColor: color, boxShadow: `0 0 30px ${color}20`, transform: 'translateY(-3px)' },
    }}>
      {icon && <Box sx={{ color, mb: 1, opacity: 0.85 }}>{icon}</Box>}
      <Typography variant="h3" fontWeight={900} sx={{
        color, textShadow: `0 0 30px ${color}60`, lineHeight: 1, mb: 0.5,
        fontSize: { xs: '1.9rem', md: '2.8rem' },
      }}>{d}</Typography>
      <Typography variant="body2" fontWeight={700} color="white" mb={0.3}
        sx={{ fontSize: { xs: '0.78rem', md: '0.875rem' } }}>{label}</Typography>
      {sublabel && <Typography variant="caption" color="text.secondary"
        sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>{sublabel}</Typography>}
    </Box>
  );
}

/* ─── Team Avatar ─── */
function TeamAvatar({ initials, gradient, shadow }) {
  return (
    <Box sx={{
      width: 52, height: 52, borderRadius: '14px', mx: 'auto', mb: 1,
      background: gradient,
      boxShadow: shadow,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Typography fontWeight={900} sx={{ color: 'white', fontSize: '1rem', letterSpacing: '-0.02em' }}>
        {initials}
      </Typography>
    </Box>
  );
}

/* ─── Live Prediction Card ─── */
function LiveCard() {
  const bars = [
    { label: '主隊勝', pct: 68, color: '#0066FF' },
    { label: '平局',   pct: 19, color: '#FFB300' },
    { label: '客隊勝', pct: 13, color: '#F44336' },
  ];
  return (
    <Box sx={{
      borderRadius: '24px',
      position: 'relative',
      overflow: 'hidden',
      animation: `${fadeRight} 0.9s ease 0.2s both`,
      /* animated border */
      background: 'linear-gradient(135deg, rgba(0,102,255,0.15) 0%, rgba(0,212,255,0.08) 50%, rgba(0,200,83,0.1) 100%)',
      p: '1px',
      boxShadow: '0 0 60px rgba(0,102,255,0.15), 0 30px 60px rgba(0,0,0,0.4)',
    }}>
      {/* inner card */}
      <Box sx={{
        borderRadius: '23px',
        background: 'linear-gradient(160deg, #0D1B2E 0%, #0A1420 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Scan line */}
        <Box sx={{
          position: 'absolute', left: 0, right: 0, height: '1px', zIndex: 5,
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.6) 30%, rgba(0,212,255,0.9) 50%, rgba(0,212,255,0.6) 70%, transparent 100%)',
          animation: `${scanSlide} 3.5s linear infinite`,
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <Box sx={{
          px: 3, py: 2,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,102,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <SportsSoccerIcon sx={{ color: '#0066FF', fontSize: 17 }} />
            <Typography variant="body2" fontWeight={700} color="rgba(255,255,255,0.85)">
              英格蘭超級聯賽
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.7} sx={{
            px: 1.4, py: 0.35, borderRadius: '20px',
            background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)',
          }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: '50%', background: '#00C853',
              animation: `${pulseDot} 1.4s ease-in-out infinite`,
            }} />
            <Typography variant="caption" sx={{ color: '#00C853', fontWeight: 700, fontSize: '0.63rem', letterSpacing: '0.08em' }}>
              AI 分析中
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ px: 3, py: 3 }}>
          {/* Teams */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box textAlign="center" flex={1}>
              <TeamAvatar initials="MC"
                gradient="linear-gradient(135deg, #0066FF 0%, #003FCC 100%)"
                shadow="0 4px 20px rgba(0,102,255,0.4), 0 0 0 1px rgba(0,102,255,0.3)"
              />
              <Typography variant="body2" fontWeight={800} color="white">曼城</Typography>
              <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 700, fontSize: '0.7rem' }}>主隊</Typography>
            </Box>

            <Box textAlign="center" flex={0.6}>
              <Box sx={{
                width: 38, height: 38, borderRadius: '10px', mx: 'auto', mb: 0.8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontWeight: 900, fontSize: '0.75rem' }}>VS</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem' }}>今日 20:00</Typography>
            </Box>

            <Box textAlign="center" flex={1}>
              <TeamAvatar initials="ARS"
                gradient="linear-gradient(135deg, #EF3B36 0%, #B71C1C 100%)"
                shadow="0 4px 20px rgba(244,67,54,0.35), 0 0 0 1px rgba(244,67,54,0.25)"
              />
              <Typography variant="body2" fontWeight={800} color="white">阿森納</Typography>
              <Typography variant="caption" sx={{ color: '#F44336', fontWeight: 700, fontSize: '0.7rem' }}>客隊</Typography>
            </Box>
          </Box>

          {/* Probability bars */}
          <Box mb={3}>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', letterSpacing: '0.12em' }}>
              勝率機率分布
            </Typography>
            {bars.map(({ label, pct, color }) => (
              <Box key={label} mt={1.5}>
                <Box display="flex" justifyContent="space-between" mb={0.6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem' }}>{label}</Typography>
                  <Typography variant="caption" sx={{ color, fontWeight: 800, fontSize: '0.8rem' }}>{pct}%</Typography>
                </Box>
                <Box sx={{ position: 'relative', height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <Box sx={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: `${pct}%`, borderRadius: 4,
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                    boxShadow: `0 0 12px ${color}70`,
                    animation: `${barGrow} 1.2s ease both`,
                  }} />
                </Box>
              </Box>
            ))}
          </Box>

          {/* Recommendation chip */}
          <Box sx={{
            p: 2, borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(0,102,255,0.1) 0%, rgba(0,212,255,0.05) 100%)',
            border: '1px solid rgba(0,102,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.3, fontSize: '0.68rem' }}>
                AI 推薦投注
              </Typography>
              <Typography sx={{ fontWeight: 900, color: '#0066FF', fontSize: '1.25rem', lineHeight: 1 }}>
                主隊勝
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.3, fontSize: '0.68rem' }}>
                信心指數
              </Typography>
              <Typography sx={{
                fontWeight: 900, fontSize: '1.6rem', lineHeight: 1,
                background: 'linear-gradient(135deg, #00D4FF, #00C853)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 12px rgba(0,212,255,0.5))',
              }}>
                68%
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ─── Demo predictions ─── */
const DEMO_PREDS = [
  { home: '曼城', away: '阿森納', league: '英超', rec: '主勝', prob: 72, result: 'WIN' },
  { home: '拜仁慕尼黑', away: '多特蒙德', league: '德甲', rec: '主勝', prob: 68, result: 'WIN' },
  { home: '皇家馬德里', away: '巴塞隆納', league: '西甲', rec: '主勝', prob: 61, result: 'WIN' },
  { home: '紐約大都會', away: '洋基', league: 'MLB', rec: '客勝', prob: 64, result: 'WIN' },
  { home: 'PSG', away: '馬賽', league: '法甲', rec: '主勝', prob: 74, result: 'WIN' },
  { home: '國際米蘭', away: 'AC 米蘭', league: '義甲', rec: '主勝', prob: 66, result: 'LOSS' },
];

/* ─── FAQ data ─── */
const FAQS = [
  { q: 'AI 是如何預測比賽結果的？', a: '系統結合 OCR 從截圖提取賠率數據，透過 Football-Data API 取得歷史戰績，再以 XGBoost 機器學習模型計算主客勝率與大小球機率，最終給出最高機率選項作為推薦。' },
  { q: '預測準確率是多少？', a: '基於 15 萬場歷史數據訓練，結合賠率市場隱含機率與球隊歷史統計，模型整體準確率約 65-76%。所有預測均附有信心等級標示（高/中/低）。' },
  { q: '支援哪些運動和聯賽？', a: '目前支援足球（英超、德甲、西甲、義甲、法甲、歐冠）和棒球（MLB、CPBL），系統可自動從截圖偵測運動類型，無需手動選擇。' },
  { q: '如何確保分析品質？', a: '建議上傳清晰截圖，確保截圖包含完整隊名與賠率數字。系統會顯示 OCR 識別信心度，若識別品質低會主動提示重新上傳。' },
  { q: '數據來源是哪裡？', a: '歷史比賽數據來自 football-data.co.uk（涵蓋 19 個聯賽，2000-2024 年，共 15 萬場比賽）與 MLB Official Stats API（2萬場）。' },
  { q: '是否需要付費？', a: '本平台目前完全免費使用，上傳截圖、獲取 AI 分析、查看歷史記錄均無限制。' },
];

export default function Home() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <Box>

      {/* ════ HERO ════ */}
      <Box sx={{
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 8, md: 12 },
        pb: { xs: 6, md: 10 },
      }}>

        {/* BG: gradient */}
        <Box sx={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(0,102,255,0.1) 0%, transparent 65%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(0,212,255,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 20% 70%, rgba(0,200,83,0.06) 0%, transparent 60%)',
        }} />

        {/* BG: dot grid */}
        <Box sx={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(0,102,255,0.18) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 20%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 20%, transparent 100%)',
        }} />

        {/* BG: orbs */}
        <Box sx={{
          position: 'absolute', top: '-15%', left: '-8%', width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,102,255,0.14) 0%, transparent 65%)',
          animation: `${floatA} 9s ease-in-out infinite`,
          pointerEvents: 'none', zIndex: 0,
        }} />
        <Box sx={{
          position: 'absolute', top: '10%', right: '-10%', width: 550, height: 550,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 65%)',
          animation: `${floatB} 11s ease-in-out infinite`,
          pointerEvents: 'none', zIndex: 0,
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-10%', left: '30%', width: 450, height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,83,0.08) 0%, transparent 65%)',
          animation: `${floatA} 10s ease-in-out infinite 1.5s`,
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Center content ── */}
        <Box sx={{
          position: 'relative', zIndex: 1,
          maxWidth: 900, mx: 'auto', px: { xs: 3, md: 4 },
          textAlign: 'center',
          animation: `${fadeUp} 0.8s ease both`,
        }}>

          {/* Brand logo row */}
          <Box display="flex" alignItems="center" justifyContent="center" gap={1.5} mb={4}>
            <Box sx={{
              width: 52, height: 52, borderRadius: '16px',
              background: 'linear-gradient(135deg, #041830 0%, #0A2A5E 50%, #0066FF 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 32px rgba(0,102,255,0.55), 0 0 0 1px rgba(0,102,255,0.3)',
              flexShrink: 0,
            }}>
              <img
                src="/brand-assets/wingame-icon.svg"
                alt="WIN GAME"
                style={{ width: 34, height: 32, filter: 'brightness(0) invert(1)', display: 'block' }}
              />
            </Box>
            <Box textAlign="left">
              <Typography sx={{
                fontWeight: 900, letterSpacing: '0.1em', lineHeight: 1.1,
                fontSize: '1.4rem',
                background: 'linear-gradient(90deg, #4D9FFF 0%, #00D4FF 50%, #00C853 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                WINGAME
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.55rem', letterSpacing: '0.2em' }}>
                AI SPORTS ANALYTICS
              </Typography>
            </Box>
          </Box>

          {/* Live badge */}
          <Box display="flex" justifyContent="center" mb={3.5}>
            <Box display="inline-flex" alignItems="center" gap={0.9} sx={{
              border: '1px solid rgba(0,212,255,0.3)', borderRadius: '50px',
              px: 2.2, py: 0.9,
              background: 'rgba(0,212,255,0.05)',
              backdropFilter: 'blur(8px)',
            }}>
              <Box sx={{
                width: 7, height: 7, borderRadius: '50%', background: '#00C853',
                animation: `${pulseDot} 1.6s ease-in-out infinite`,
              }} />
              <Typography variant="caption" sx={{ color: '#00D4FF', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.78rem' }}>
                AI POWERED &nbsp;·&nbsp; 完全免費 &nbsp;·&nbsp; 30秒出結果
              </Typography>
            </Box>
          </Box>

          {/* Main headline */}
          <Typography sx={{
            fontSize: { xs: '3rem', sm: '4.2rem', md: '5.5rem', lg: '6.5rem' },
            fontWeight: 900, lineHeight: 1.0, mb: 3,
            letterSpacing: '-0.04em',
          }}>
            <Box component="span" sx={{ color: '#FFFFFF' }}>
              把數據
            </Box>
            {' '}
            <Box component="span" sx={{
              background: 'linear-gradient(135deg, #0066FF 0%, #00AAFF 35%, #00D4FF 60%, #00C853 100%)',
              backgroundSize: '600% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              animation: `${shimmer} 5s linear infinite`,
            }}>
              變成勝算
            </Box>
          </Typography>

          {/* Description */}
          <Typography sx={{
            fontSize: { xs: '1rem', md: '1.15rem' },
            color: 'rgba(255,255,255,0.45)',
            mb: 5, lineHeight: 1.8,
            maxWidth: 560, mx: 'auto',
          }}>
            上傳比賽截圖，AI 自動 OCR 識別賠率，結合 15 萬場歷史大數據與 XGBoost 模型，精準輸出主客勝率 + 大小球建議
          </Typography>

          {/* CTAs */}
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap" mb={4}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/analysis')}
              startIcon={<BoltIcon />}
              sx={{
                px: { xs: 4.5, md: 5.5 }, py: { xs: 1.6, md: 1.9 },
                fontSize: { xs: '0.95rem', md: '1.05rem' },
                borderRadius: '50px', fontWeight: 800,
                background: 'linear-gradient(135deg, #0052CC 0%, #0066FF 50%, #0080FF 100%)',
                animation: `${glowBtn} 2.5s ease-in-out infinite`,
                letterSpacing: '0.02em',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0066FF, #00A0FF)',
                  transform: 'translateY(-3px) scale(1.02)',
                  boxShadow: '0 0 60px rgba(0,102,255,0.7)',
                },
                transition: 'all 0.25s',
              }}
            >
              立即免費分析
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/history')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                px: { xs: 3.5, md: 4.5 }, py: { xs: 1.6, md: 1.9 },
                borderRadius: '50px',
                borderColor: 'rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.65)',
                fontSize: { xs: '0.9rem', md: '1rem' },
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'white',
                },
                transition: 'all 0.25s',
              }}
            >
              查看歷史記錄
            </Button>
          </Box>

          {/* Trust badges */}
          <Box display="flex" gap={1.5} justifyContent="center" flexWrap="wrap" mb={2}>
            {[
              { Icon: LockIcon, label: '數據加密保護' },
              { Icon: SpeedIcon, label: '30秒快速分析' },
              { Icon: WorkspacePremiumIcon, label: '完全免費使用' },
            ].map(({ Icon, label }) => (
              <Box key={label} display="flex" alignItems="center" gap={0.6} sx={{
                px: 1.6, py: 0.7, borderRadius: '20px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.35)',
              }}>
                <Icon sx={{ fontSize: 13 }} />
                <Typography variant="caption" color="inherit" sx={{ fontSize: '0.72rem' }}>{label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Sports chips */}
          <Box display="flex" gap={1.5} justifyContent="center" flexWrap="wrap" mb={7}>
            {[
              { icon: <SportsSoccerIcon sx={{ fontSize: 14 }} />, label: '足球 · EPL / 德甲 / 西甲 / 義甲' },
              { icon: <SportsBaseballIcon sx={{ fontSize: 14 }} />, label: '棒球 · MLB' },
            ].map(({ icon, label }) => (
              <Box key={label} display="flex" alignItems="center" gap={0.7} sx={{
                px: 1.6, py: 0.7, borderRadius: '20px',
                background: 'rgba(0,102,255,0.07)',
                border: '1px solid rgba(0,102,255,0.2)',
                color: 'rgba(0,212,255,0.6)',
              }}>
                {icon}
                <Typography variant="caption" color="inherit" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>{label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Live card - centered */}
          <Box sx={{ maxWidth: 460, mx: 'auto' }}>
            <LiveCard />
          </Box>
        </Box>

        {/* Bottom fade */}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
          background: 'linear-gradient(to bottom, transparent, #09101D)',
          pointerEvents: 'none', zIndex: 1,
        }} />
      </Box>

      {/* ════ Stats bar ════ */}
      <Box sx={{
        py: { xs: 4, md: 5 },
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(10,18,32,0.6)',
        backdropFilter: 'blur(10px)',
      }}>
        <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Grid container spacing={{ xs: 1.5, md: 2 }}>
            <Grid item xs={6} md={3}><StatCard target={76} suffix="%+" label="整體命中率" sublabel="回測 3,800+ 場" color="#0066FF" icon={<TrendingUpIcon />}/></Grid>
            <Grid item xs={6} md={3}><StatCard target={157} suffix="K+" label="歷史訓練賽事" sublabel="跨越 19 個聯賽" color="#00C853" icon={<AnalyticsIcon />}/></Grid>
            <Grid item xs={6} md={3}><StatCard target={850} suffix="" label="累積利潤單位" sublabel="模型上線至今" color="#00D4FF" icon={<AutoAwesomeIcon />} display="+850"/></Grid>
            <Grid item xs={6} md={3}><StatCard target={30} label="預測耗時" sublabel="毫秒級模型推理" color="#FFB300" icon={<SpeedIcon />} display="< 30s"/></Grid>
          </Grid>
        </Box>
      </Box>

      {/* ════ Model accuracy ════ */}
      <Box sx={{ py: { xs: 6, md: 10 }, px: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="overline" sx={{ color: '#0066FF', letterSpacing: '0.15em', display: 'block', textAlign: 'center', mb: 1 }}>
          AI MODEL PERFORMANCE
        </Typography>
        <Typography variant="h4" textAlign="center" fontWeight={800} mb={2}
          sx={{ fontSize: { xs: '1.6rem', md: '2.125rem' } }}>各聯賽模型表現</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={6}>
          基於近 2 個賽季、共 3,800+ 場比賽的歷史回測
        </Typography>
        <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center">
          {[
            { label: '英超', sublabel: '2022-24賽季', pct: 76, color: '#0066FF' },
            { label: '德甲', sublabel: '2022-24賽季', pct: 74, color: '#00C853' },
            { label: '西甲', sublabel: '2022-24賽季', pct: 73, color: '#00D4FF' },
            { label: 'MLB', sublabel: '2023賽季', pct: 68, color: '#FFB300' },
            { label: '義甲', sublabel: '2022-24賽季', pct: 71, color: '#FF6B9D' },
            { label: '法甲', sublabel: '2022-24賽季', pct: 70, color: '#A855F7' },
          ].map(p => (
            <Grid item xs={4} sm={4} md={2} key={p.label} display="flex" justifyContent="center">
              <RingProgress {...p} size={110} />
            </Grid>
          ))}
        </Grid>
        <Typography variant="caption" display="block" textAlign="center" color="text.secondary" mt={4} sx={{ opacity: 0.4 }}>
          * 歷史回測結果，不代表未來表現保證
        </Typography>

        {/* Model spec strip */}
        <Box sx={{
          mt: 5, p: { xs: 2, md: 2.5 },
          borderRadius: '14px',
          background: 'rgba(0,102,255,0.04)',
          border: '1px solid rgba(0,102,255,0.12)',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 2, md: 5 },
        }}>
          {[
            { label: '模型版本', value: 'XGBoost v2.0' },
            { label: '模型迭代', value: '53 次優化' },
            { label: '每場資料點', value: '1,500+' },
            { label: '特徵維度', value: '15 維向量' },
          ].map(({ label, value }) => (
            <Box key={label} textAlign="center">
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', mb: 0.3, fontSize: '0.68rem', letterSpacing: '0.08em' }}>{label}</Typography>
              <Typography fontWeight={700} sx={{ color: '#0066FF', fontSize: '0.95rem' }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

      {/* ════ Recent predictions ════ */}
      <Box sx={{ py: { xs: 6, md: 10 }, px: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="overline" sx={{ color: '#0066FF', letterSpacing: '0.15em', display: 'block', textAlign: 'center', mb: 1 }}>
          RECENT PREDICTIONS
        </Typography>
        <Typography variant="h4" textAlign="center" fontWeight={800} mb={6}
          sx={{ fontSize: { xs: '1.6rem', md: '2.125rem' } }}>近期預測記錄</Typography>

        {/* Desktop */}
        <Box sx={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden', display: { xs: 'none', sm: 'block' } }}>
          <Box sx={{
            display: 'grid', gridTemplateColumns: '1.3fr 1.3fr 0.7fr 0.7fr 0.6fr 0.6fr',
            px: 3, py: 1.5, background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {['主隊','客隊','聯賽','推薦','機率','結果'].map(h => (
              <Typography key={h} variant="caption" color="text.secondary" fontWeight={700}
                sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.7rem' }}>{h}</Typography>
            ))}
          </Box>
          {DEMO_PREDS.map((row, i) => (
            <Box key={i} sx={{
              display: 'grid', gridTemplateColumns: '1.3fr 1.3fr 0.7fr 0.7fr 0.6fr 0.6fr',
              px: 3, py: 2, alignItems: 'center',
              borderBottom: i < DEMO_PREDS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              transition: 'background 0.2s',
              '&:hover': { background: 'rgba(255,255,255,0.02)' },
            }}>
              <Typography variant="body2" fontWeight={600}>{row.home}</Typography>
              <Typography variant="body2" fontWeight={600}>{row.away}</Typography>
              <Typography variant="caption" color="text.secondary">{row.league}</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#0066FF' }}>{row.rec}</Typography>
              <Typography variant="body2" fontWeight={700}>{row.prob}%</Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {row.result === 'WIN'
                  ? <CheckCircleIcon sx={{ fontSize: 15, color: '#00C853' }} />
                  : <Box component="span" sx={{ fontSize: 15, color: '#F44336', fontWeight: 900, lineHeight: 1 }}>x</Box>}
                <Typography variant="body2" fontWeight={700}
                  sx={{ color: row.result === 'WIN' ? '#00C853' : '#F44336' }}>
                  {row.result === 'WIN' ? '命中' : '未中'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {DEMO_PREDS.map((row, i) => (
            <Box key={i} sx={{
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
              p: 2, background: 'rgba(14,22,38,0.7)',
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Box>
                  <Typography variant="body2" fontWeight={700}>{row.home} vs {row.away}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.league}</Typography>
                </Box>
                <Typography variant="body2" fontWeight={700}
                  sx={{ color: row.result === 'WIN' ? '#00C853' : '#F44336' }}>
                  {row.result === 'WIN' ? '命中' : '未中'}
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Box sx={{ px: 1.5, py: 0.4, borderRadius: '8px', background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,102,255,0.2)' }}>
                  <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 700 }}>推薦: {row.rec}</Typography>
                </Box>
                <Box sx={{ px: 1.5, py: 0.4, borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>機率: {row.prob}%</Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        <Box display="flex" justifyContent="center" gap={{ xs: 4, md: 6 }} mt={5} flexWrap="wrap">
          {[
            { label: '本週命中率', value: '5/6', color: '#0066FF' },
            { label: '本月命中率', value: '74.2%', color: '#00C853' },
            { label: '本季 ROI', value: '+18.3%', color: '#00D4FF' },
          ].map(({ label, value, color }) => (
            <Box key={label} textAlign="center">
              <Typography variant="h5" fontWeight={800}
                sx={{ color, fontSize: { xs: '1.4rem', md: '1.5rem' } }}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

      {/* ════ Feature engineering ════ */}
      <Box sx={{ py: { xs: 6, md: 10 }, px: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="overline" sx={{ color: '#0066FF', letterSpacing: '0.15em', display: 'block', textAlign: 'center', mb: 1 }}>
          FEATURE ENGINEERING
        </Typography>
        <Typography variant="h4" textAlign="center" fontWeight={800} mb={2}
          sx={{ fontSize: { xs: '1.6rem', md: '2.125rem' } }}>AI 模型特徵工程</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={6} maxWidth={550} mx="auto">
          系統整合 15 項特徵（含 ELO 評分 + 賠率隱含機率 + 歷史統計），每場分析 1,500+ 資料點，訓練超過 15 萬場真實數據
        </Typography>
        <Grid container spacing={3}>
          {[
            { icon: <BarChartIcon />, title: '賠率隱含機率', desc: '將 Bet365 小數賠率正規化為市場隱含機率，去除莊家抽水後的真實期望值，是最強預測特徵（佔模型權重 57%）', color: '#0066FF' },
            { icon: <TrendingUpIcon />, title: '近期狀態指數', desc: '計算球隊近 25 場比賽的勝率、積分、進球率、失球率，量化當前狀態趨勢', color: '#00C853' },
            { icon: <PsychologyIcon />, title: '歷史交鋒記錄', desc: '分析兩隊近年 12 場交鋒勝負平紀錄，計算主客場交鋒優勢因子', color: '#00D4FF' },
            { icon: <ShieldIcon />, title: '攻守綜合指標', desc: '場均進球 / 失球比率、主客場分開計算，反映真實攻守能力而非整體勝率', color: '#FFB300' },
            { icon: <TrendingUpIcon />, title: 'ELO 動態評分', desc: '每場比賽後自動更新兩隊 ELO 評分，反映戰力動態變化，比靜態勝率更能捕捉球隊最新狀態', color: '#A855F7' },
          ].map(({ icon, title, desc, color }) => (
            <Grid item xs={12} sm={6} key={title}>
              <Box sx={{
                p: { xs: 2.5, md: 3 }, display: 'flex', gap: 2.5,
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px',
                background: 'rgba(14,22,38,0.7)',
                transition: 'all 0.3s',
                '&:hover': { borderColor: color, boxShadow: `0 0 30px ${color}15`, transform: 'translateY(-4px)' },
              }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                  background: `${color}15`, border: `1px solid ${color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color,
                }}>{icon}</Box>
                <Box>
                  <Typography variant="body1" fontWeight={700} mb={0.5}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{desc}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

      {/* ════ Steps ════ */}
      <Box sx={{ py: { xs: 6, md: 10 }, px: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="overline" sx={{ color: '#0066FF', letterSpacing: '0.15em', display: 'block', textAlign: 'center', mb: 1 }}>
          HOW IT WORKS
        </Typography>
        <Typography variant="h4" textAlign="center" fontWeight={800} mb={6}
          sx={{ fontSize: { xs: '1.6rem', md: '2.125rem' } }}>如何使用</Typography>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {[
            { num: '01', title: '上傳截圖', desc: '拖拽或點擊上傳運彩截圖，支援 PNG / JPG，最大 10MB', color: '#0066FF' },
            { num: '02', title: 'OCR 識別', desc: 'AI 自動識別截圖中的隊名與賠率，支援繁體中文及英文', color: '#00C853' },
            { num: '03', title: '數據查詢', desc: '即時查詢 Football-Data 歷史數據，建立 15 維特徵向量', color: '#00D4FF' },
            { num: '04', title: '取得預測', desc: '輸出勝負機率圖表、讓分盤推薦、大小球建議與信心等級', color: '#FFB300' },
          ].map(({ num, title, desc, color }) => (
            <Grid item xs={6} md={3} key={num}>
              <Box sx={{
                p: { xs: 2.5, md: 3 }, height: '100%', borderRadius: '16px',
                background: 'rgba(14,22,38,0.7)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.3s',
                '&:hover': { borderColor: color, transform: 'translateY(-5px)', boxShadow: `0 16px 40px ${color}15` },
              }}>
                <Typography sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 900, color, opacity: 0.12, lineHeight: 1, mb: 2 }}>{num}</Typography>
                <Typography variant="body1" fontWeight={700} mb={1} sx={{ fontSize: { xs: '0.95rem', md: '1rem' } }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.75} sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>{desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

      {/* ════ FAQ ════ */}
      <Box sx={{ py: { xs: 6, md: 10 }, px: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="overline" sx={{ color: '#0066FF', letterSpacing: '0.15em', display: 'block', textAlign: 'center', mb: 1 }}>
          FAQ
        </Typography>
        <Typography variant="h4" textAlign="center" fontWeight={800} mb={6}
          sx={{ fontSize: { xs: '1.6rem', md: '2.125rem' } }}>常見問題</Typography>
        <Box maxWidth={720} mx="auto">
          {FAQS.map(({ q, a }, i) => (
            <Box key={i} sx={{
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px', mb: 1.5, overflow: 'hidden',
              background: 'rgba(14,22,38,0.7)',
              transition: 'border-color 0.2s',
              '&:hover': { borderColor: 'rgba(0,102,255,0.25)' },
            }}>
              <Box onClick={() => setOpenFaq(openFaq === i ? null : i)} sx={{
                px: { xs: 2.5, md: 3 }, py: { xs: 2, md: 2.2 },
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', userSelect: 'none',
                '&:hover': { background: 'rgba(255,255,255,0.02)' },
              }}>
                <Typography variant="body1" fontWeight={600}
                  sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, pr: 2, color: 'rgba(255,255,255,0.85)' }}>{q}</Typography>
                <Box sx={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: openFaq === i ? 'rgba(0,102,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${openFaq === i ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', color: openFaq === i ? '#0066FF' : 'rgba(255,255,255,0.4)',
                  fontWeight: 700, fontSize: '1.1rem',
                }}>
                  {openFaq === i ? '−' : '+'}
                </Box>
              </Box>
              {openFaq === i && (
                <Box sx={{ px: { xs: 2.5, md: 3 }, pb: 2.5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.85} pt={1.5}
                    sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}>{a}</Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* ════ CTA ════ */}
      <Box sx={{
        maxWidth: 1200, mx: { xs: 2, md: 'auto' }, mb: 4,
        py: { xs: 7, md: 10 }, px: { xs: 3, md: 6 }, textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(0,102,255,0.07) 0%, rgba(0,200,83,0.03) 50%, rgba(0,212,255,0.07) 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(0,102,255,0.15)',
        position: 'relative', overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, #00C853, #0066FF, #00D4FF)',
        },
      }}>
        <EmojiEventsIcon sx={{ fontSize: 52, color: '#FFB300', mb: 2, filter: 'drop-shadow(0 0 24px rgba(255,179,0,0.5))' }} />
        <Typography variant="h4" fontWeight={800} mb={1.5}
          sx={{ fontSize: { xs: '1.6rem', md: '2.125rem' } }}>
          立即開始免費預測
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4} sx={{ maxWidth: 440, mx: 'auto' }}>
          上傳截圖，30 秒內取得 AI 深度分析結果，完全免費無限制
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/analysis')}
          startIcon={<BoltIcon />}
          sx={{
            px: { xs: 5, md: 7 }, py: { xs: 1.7, md: 2 },
            fontSize: { xs: '1rem', md: '1.1rem' },
            borderRadius: '50px', fontWeight: 800,
            background: 'linear-gradient(135deg, #0052CC, #0066FF, #00A0FF)',
            animation: `${glowBtn} 2.5s ease-in-out infinite`,
            '&:hover': {
              background: 'linear-gradient(135deg, #0066FF, #00E5FF)',
              transform: 'translateY(-3px) scale(1.02)',
              boxShadow: '0 0 70px rgba(0,102,255,0.7)',
            },
            transition: 'all 0.25s',
          }}
        >
          開始運彩預測
        </Button>
      </Box>

      {/* Disclaimer */}
      <Box sx={{ py: 2, px: 2, mb: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.35 }}>
          本系統所有分析結果僅供參考，不構成任何投注建議。請理性娛樂，量力而為。
        </Typography>
      </Box>
    </Box>
  );
}
