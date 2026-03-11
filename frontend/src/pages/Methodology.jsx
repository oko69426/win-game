import React, { useState } from 'react';
import { Box, Typography, Grid, Divider, Chip } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import StorageIcon from '@mui/icons-material/Storage';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BarChartIcon from '@mui/icons-material/BarChart';
import BoltIcon from '@mui/icons-material/Bolt';
import ShieldIcon from '@mui/icons-material/Shield';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

/* ── Constants ── */
const NEON = '#0066FF';
const NEON2 = '#00D4FF';
const BG = '#0A1628';
const CARD_BG = '#141F2E';

/* ── Pipeline Steps ── */
const PIPELINE_STEPS = [
  {
    icon: <CloudUploadIcon sx={{ fontSize: 28, color: NEON }} />,
    title: '截圖上傳',
    desc: '支援 PNG/JPG, EasyOCR 識別',
  },
  {
    icon: <TextFieldsIcon sx={{ fontSize: 28, color: NEON }} />,
    title: 'OCR 解析',
    desc: '提取隊名/賠率/時間',
  },
  {
    icon: <StorageIcon sx={{ fontSize: 28, color: NEON }} />,
    title: 'API 查詢',
    desc: 'Football-Data / MLB Stats',
  },
  {
    icon: <PsychologyIcon sx={{ fontSize: 28, color: NEON }} />,
    title: 'ML 預測',
    desc: 'XGBoost 12維特徵',
  },
  {
    icon: <AutoAwesomeIcon sx={{ fontSize: 28, color: NEON }} />,
    title: '報告生成',
    desc: 'Qwen AI 繁中分析',
  },
];

/* ── 12 Features ── */
const FEATURES = [
  { key: 'home_win_rate',            label: '主隊歷史勝率',   color: '#0066FF' },
  { key: 'home_form_points',         label: '主隊近期積分',   color: '#00C853' },
  { key: 'home_avg_goals_scored',    label: '主隊場均進球',   color: '#00D4FF' },
  { key: 'home_avg_goals_conceded',  label: '主隊場均失球',   color: '#FFB300' },
  { key: 'home_draw_rate',           label: '主隊平局率',     color: '#FF6B9D' },
  { key: 'away_win_rate',            label: '客隊歷史勝率',   color: '#0066FF' },
  { key: 'away_form_points',         label: '客隊近期積分',   color: '#00C853' },
  { key: 'away_avg_goals_scored',    label: '客隊場均進球',   color: '#00D4FF' },
  { key: 'away_avg_goals_conceded',  label: '客隊場均失球',   color: '#FFB300' },
  { key: 'away_draw_rate',           label: '客隊平局率',     color: '#FF6B9D' },
  { key: 'h2h_home_win_rate',        label: '交鋒主隊勝率',   color: '#A855F7' },
  { key: 'h2h_draw_rate',            label: '交鋒平局率',     color: '#A855F7' },
];

/* ── Model Specs ── */
const MODEL_SPECS = [
  { label: '算法',       value: 'XGBoost Classifier' },
  { label: '輸入特徵',   value: '12 維' },
  { label: '輸出',       value: '3 類別 (主勝/平/客勝)' },
  { label: '訓練數據',   value: '1,752 場比賽' },
  { label: '訓練準確率', value: '48.7%' },
  { label: '資料來源',   value: 'Football-Data.org' },
];

/* ── Data Sources ── */
const DATA_SOURCES = [
  {
    name: 'Football-Data.org',
    subtitle: '足球歷史數據',
    desc: '覆蓋英超/德甲/西甲/義甲/法甲，逾 10 年數據，1,000+ 場/賽季',
    icon: <BarChartIcon sx={{ fontSize: 32, color: NEON }} />,
  },
  {
    name: 'MLB Stats API',
    subtitle: '棒球官方數據',
    desc: '美國職棒大聯盟官方 API，近 15 場滾動勝率，免費無需金鑰',
    icon: <TrendingUpIcon sx={{ fontSize: 32, color: NEON }} />,
  },
  {
    name: 'DashScope Qwen',
    subtitle: 'AI 分析報告',
    desc: '阿里雲 Qwen AI，生成繁體中文深度分析，qwen-plus 模型',
    icon: <AutoAwesomeIcon sx={{ fontSize: 32, color: NEON }} />,
  },
];

/* ── FAQ ── */
const FAQS = [
  {
    q: 'OCR 識別率如何?',
    a: '使用 EasyOCR 繁體中文模型，清晰截圖識別率達 90%+，建議截圖解析度 720p 以上。',
  },
  {
    q: '為何訓練準確率只有 48.7%?',
    a: '48.7% 是 3 分類問題（主勝/平/客勝）的準確率，隨機基線為 33%，高於基線約 15%。足球隨機性高，業界頂尖模型也在 50-55%。',
  },
  {
    q: '如何解讀信心等級?',
    a: '高信心 = 模型三分類概率差距大（>20%），中 = 10-20%，低 = <10%。建議選擇高信心預測。',
  },
  {
    q: '可以信任 AI 分析報告嗎?',
    a: 'Qwen AI 報告基於數據摘要生成，提供人性化解讀，但核心決策依據仍是 XGBoost 機率數字。',
  },
];

/* ── Main Page ── */
export default function Methodology() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  return (
    <Box sx={{ background: BG, minHeight: '100vh', color: '#fff' }}>

      {/* ══ Section 1: Header ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography
          sx={{
            fontSize: 12,
            letterSpacing: 3,
            color: '#0066FF',
            textTransform: 'uppercase',
            fontWeight: 700,
            mb: 1.5,
          }}
        >
          HOW IT WORKS
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>
          模型方法論
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          從截圖上傳到預測輸出的完整技術流程
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ Section 2: Pipeline Flow ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          分析管線
        </Typography>

        {/* Scrollable horizontal flow */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 1,
            alignItems: 'center',
            overflowX: { xs: 'auto', md: 'visible' },
            pb: { xs: 1, md: 0 },
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(0,102,255,0.3)', borderRadius: 2 },
          }}
        >
          {PIPELINE_STEPS.map((step, i) => (
            <React.Fragment key={step.title}>
              {/* Step card */}
              <Box
                sx={{
                  border: '1px solid rgba(0,102,255,0.2)',
                  borderRadius: 2,
                  p: 2.5,
                  background: '#141F2E',
                  minWidth: { xs: 140, md: 'unset' },
                  flex: { xs: '0 0 auto', md: 1 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  textAlign: 'center',
                }}
              >
                {step.icon}
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>
                  {step.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                  {step.desc}
                </Typography>
              </Box>

              {/* Arrow between steps */}
              {i < PIPELINE_STEPS.length - 1 && (
                <Typography
                  sx={{
                    color: '#0066FF',
                    opacity: 0.5,
                    fontSize: 20,
                    flexShrink: 0,
                    userSelect: 'none',
                  }}
                >
                  →
                </Typography>
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ Section 3: 12 Feature Cards ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          12 維特徵向量
        </Typography>

        <Grid container spacing={2}>
          {FEATURES.map((f) => (
            <Grid item xs={12} sm={6} md={4} key={f.key}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 1.5,
                  background: '#141F2E',
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center',
                }}
              >
                {/* Colored dot */}
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: f.color,
                    flexShrink: 0,
                  }}
                />
                {/* Text */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>
                    {f.key}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {f.label}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ Section 4: Model Architecture ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          XGBoost 模型架構
        </Typography>

        <Grid container spacing={4}>
          {/* Left: model specs */}
          <Grid item xs={12} md={6}>
            <Box>
              {MODEL_SPECS.map((spec, i) => (
                <Box
                  key={spec.label}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1.2,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {spec.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>
                    {spec.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Right: three-tier fallback */}
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 2, color: '#fff' }}>
              三層 Fallback 機制
            </Typography>

            {/* Tier 1 */}
            <Box
              sx={{
                borderLeft: '4px solid #0066FF',
                p: 2,
                mb: 1.5,
                background: 'rgba(0,102,255,0.05)',
                borderRadius: '0 8px 8px 0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Chip
                  label="Tier 1"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(0,102,255,0.15)',
                    color: '#0066FF',
                    border: '1px solid rgba(0,102,255,0.4)',
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>
                  XGBoost 模型
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                最高準確率，需pkl模型
              </Typography>
            </Box>

            {/* Tier 2 */}
            <Box
              sx={{
                borderLeft: '4px solid #FFB300',
                p: 2,
                mb: 1.5,
                background: 'rgba(255,165,2,0.05)',
                borderRadius: '0 8px 8px 0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Chip
                  label="Tier 2"
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 700, fontSize: 11 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>
                  規則推算
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                賠率隱含機率加權
              </Typography>
            </Box>

            {/* Tier 3 */}
            <Box
              sx={{
                borderLeft: '4px solid #FF6B35',
                p: 2,
                mb: 1.5,
                background: 'rgba(255,107,53,0.05)',
                borderRadius: '0 8px 8px 0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Chip
                  label="Tier 3"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,107,53,0.15)',
                    color: '#FF6B35',
                    border: '1px solid rgba(255,107,53,0.4)',
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>
                  統計基線
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                歷史勝率均值
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ Section 5: Data Sources ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          數據來源
        </Typography>

        <Grid container spacing={3}>
          {DATA_SOURCES.map((src) => (
            <Grid item xs={12} sm={4} key={src.name}>
              <Box
                sx={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  p: 3,
                  background: '#141F2E',
                  height: '100%',
                }}
              >
                <Box sx={{ mb: 1.5 }}>{src.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {src.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {src.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ Section 6: Limitations ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Box
          sx={{
            border: '1px solid rgba(255,165,0,0.25)',
            borderRadius: 2,
            p: 3,
            background: 'rgba(255,165,0,0.04)',
          }}
        >
          {/* Title row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <WarningIcon sx={{ color: '#FFB300', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFB300' }}>
              重要限制聲明
            </Typography>
          </Box>

          {/* Bullet points */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              '模型基於歷史數據訓練，無法預測突發事件（傷病、罰牌、天氣）',
              '足球比賽隨機性高，即使頂尖模型準確率也在 50-60% 範圍',
              '賠率包含莊家抽水，實際期望值低於表面數字',
              '本系統所有輸出僅供娛樂參考，請理性決策',
            ].map((text, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <CheckCircleIcon sx={{ color: '#FFB300', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ Section 7: FAQ Accordion ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          技術 FAQ
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {FAQS.map((faq, i) => (
            <Box
              key={i}
              sx={{
                border: `1px solid ${openFaq === i ? 'rgba(0,102,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'border-color 0.25s',
              }}
            >
              {/* Question row */}
              <Box
                onClick={() => toggleFaq(i)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 3,
                  py: 2,
                  cursor: 'pointer',
                  background: openFaq === i ? 'rgba(0,102,255,0.04)' : 'transparent',
                  '&:hover': { background: 'rgba(255,255,255,0.03)' },
                  transition: 'background 0.2s',
                  userSelect: 'none',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
                  {faq.q}
                </Typography>
                <Typography
                  sx={{
                    color: openFaq === i ? '#0066FF' : 'text.secondary',
                    fontSize: 20,
                    lineHeight: 1,
                    flexShrink: 0,
                    ml: 2,
                    transition: 'transform 0.25s, color 0.25s',
                    transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                >
                  +
                </Typography>
              </Box>

              {/* Answer (animated reveal) */}
              <Box
                sx={{
                  maxHeight: openFaq === i ? '300px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.35s ease',
                }}
              >
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ px: 3, py: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                    {faq.a}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

    </Box>
  );
}
