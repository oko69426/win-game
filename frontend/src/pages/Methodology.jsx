import React, { useState } from 'react';
import { Box, Typography, Grid, Divider } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

/* ── Pipeline Steps ── */
const PIPELINE_STEPS = [
  {
    icon: <CloudUploadIcon sx={{ fontSize: 28, color: '#0066FF' }} />,
    title: '截圖上傳',
    desc: '支援主流博彩平台截圖格式',
  },
  {
    icon: <TextFieldsIcon sx={{ fontSize: 28, color: '#0066FF' }} />,
    title: '智能識別',
    desc: '多語言 AI 影像解析引擎',
  },
  {
    icon: <StorageIcon sx={{ fontSize: 28, color: '#0066FF' }} />,
    title: '數據串接',
    desc: '即時查詢多源歷史數據庫',
  },
  {
    icon: <PsychologyIcon sx={{ fontSize: 28, color: '#0066FF' }} />,
    title: 'AI 預測',
    desc: '尖端深度學習模型推論',
  },
  {
    icon: <AutoAwesomeIcon sx={{ fontSize: 28, color: '#0066FF' }} />,
    title: '報告生成',
    desc: '繁體中文深度分析報告',
  },
];

/* ── Analysis Dimensions ── */
const FEATURES = [
  { label: '主隊近期勝率',   desc: '最近 20 場滾動勝率趨勢',   color: '#0066FF' },
  { label: '客隊近期勝率',   desc: '最近 20 場滾動勝率趨勢',   color: '#0066FF' },
  { label: '主隊進攻強度',   desc: '場均進球與射門數多維評估', color: '#00C853' },
  { label: '客隊進攻強度',   desc: '場均進球與射門數多維評估', color: '#00C853' },
  { label: '主隊防守穩定性', desc: '場均失球與封鎖率綜合指標', color: '#00D4FF' },
  { label: '客隊防守穩定性', desc: '場均失球與封鎖率綜合指標', color: '#00D4FF' },
  { label: '近期積分趨勢',   desc: '近 5/10 場積分動能曲線',   color: '#FFB300' },
  { label: '主客場優勢係數', desc: '主場加成歷史統計校正',     color: '#FFB300' },
  { label: '交鋒歷史紀錄',   desc: '近 10 次直接對陣勝率',     color: '#FF6B9D' },
  { label: '賠率市場隱含值', desc: '市場共識機率逆推與偏差',   color: '#FF6B9D' },
  { label: '陣容傷停狀態',   desc: '主力球員出賽影響權重',     color: '#A855F7' },
  { label: '聯賽階段權重',   desc: '積分榜位置與爭冠/保級壓力', color: '#A855F7' },
];

/* ── Model Specs ── */
const MODEL_SPECS = [
  { label: '模型架構',   value: '尖端 AI 深度學習' },
  { label: '分析維度',   value: '1,500+ 資料點' },
  { label: '訓練數據',   value: '15萬+ 場歷史賽事' },
  { label: '整體準確率', value: '76%+' },
  { label: '監控聯賽',   value: '六大頂級聯賽' },
  { label: '數據更新',   value: '即時串接多源數據庫' },
];

/* ── Data Sources ── */
const DATA_SOURCES = [
  {
    name: '國際官方體育數據庫',
    subtitle: '賽事歷史數據',
    desc: '涵蓋英超、德甲、西甲、義甲、法甲等六大聯賽，超過 10 年完整賽事記錄，15萬+ 場數據支撐模型訓練。',
    icon: <BarChartIcon sx={{ fontSize: 32, color: '#0066FF' }} />,
  },
  {
    name: '即時數據串接引擎',
    subtitle: '多源聚合分析',
    desc: '整合多個官方體育數據源，自動更新陣容、傷停、賠率等關鍵指標，確保每次預測使用最新資訊。',
    icon: <TrendingUpIcon sx={{ fontSize: 32, color: '#0066FF' }} />,
  },
  {
    name: 'AI 深度分析報告',
    subtitle: '自然語言生成',
    desc: '大型語言模型驅動的分析報告引擎，將數字轉化為繁體中文深度解讀，讓用戶快速掌握關鍵洞察。',
    icon: <AutoAwesomeIcon sx={{ fontSize: 32, color: '#0066FF' }} />,
  },
];

/* ── FAQ ── */
const FAQS = [
  {
    q: '截圖識別支援哪些平台？',
    a: '支援繁體中文、簡體中文及英文介面的主流博彩平台截圖，建議截圖解析度 720p 以上，識別率可達 90%+。',
  },
  {
    q: 'AI 模型如何確保預測準確率？',
    a: '系統基於 15萬+ 場歷史賽事訓練，整合超過 1,500 個分析維度，持續以最新賽事數據更新校正，整體準確率維持 76%+。',
  },
  {
    q: '如何解讀信心等級？',
    a: '高信心代表 AI 模型對結果高度確信，多項指標高度一致；中信心為有參考價值但存在變數；低信心建議謹慎參考。建議優先關注高信心推薦。',
  },
  {
    q: '每日精選如何篩選？',
    a: '系統每日自動掃描六大聯賽當日賽事，僅篩選信心度達標的比賽呈現，通常為當日最具分析價值的 3-8 場。',
  },
];

/* ── Main Page ── */
export default function Methodology() {
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  return (
    <Box sx={{ color: '#fff' }}>

      {/* ══ Header ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography sx={{ fontSize: 12, letterSpacing: 3, color: '#0066FF', textTransform: 'uppercase', fontWeight: 700, mb: 1.5 }}>
          HOW IT WORKS
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>
          AI 分析方法論
        </Typography>
        <Typography variant="body1" color="text.secondary">
          從截圖上傳到預測輸出的完整 AI 分析流程
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ Pipeline ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>分析流程</Typography>
        <Box sx={{
          display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center',
          overflowX: { xs: 'auto', md: 'visible' }, pb: { xs: 1, md: 0 },
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0,102,255,0.3)', borderRadius: 2 },
        }}>
          {PIPELINE_STEPS.map((step, i) => (
            <React.Fragment key={step.title}>
              <Box sx={{
                border: '1px solid rgba(0,102,255,0.2)', borderRadius: 2, p: 2.5,
                background: '#141F2E', minWidth: { xs: 140, md: 'unset' },
                flex: { xs: '0 0 auto', md: 1 },
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, textAlign: 'center',
              }}>
                {step.icon}
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>{step.title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{step.desc}</Typography>
              </Box>
              {i < PIPELINE_STEPS.length - 1 && (
                <Typography sx={{ color: '#0066FF', opacity: 0.5, fontSize: 20, flexShrink: 0, userSelect: 'none' }}>→</Typography>
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ Analysis Dimensions ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>核心分析維度</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          AI 模型整合 1,500+ 資料點，以下為核心分析層面
        </Typography>
        <Grid container spacing={2}>
          {FEATURES.map((f) => (
            <Grid item xs={12} sm={6} md={4} key={f.label}>
              <Box sx={{
                p: 2, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 1.5,
                background: '#141F2E', display: 'flex', gap: 1.5, alignItems: 'flex-start',
              }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: f.color, flexShrink: 0, mt: 0.6 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>{f.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{f.desc}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ Model Specs ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>AI 模型規格</Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box>
              {MODEL_SPECS.map((spec) => (
                <Box key={spec.label} sx={{
                  display: 'flex', justifyContent: 'space-between',
                  py: 1.2, borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <Typography variant="body2" color="text.secondary">{spec.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>{spec.value}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 2, color: '#fff' }}>模型可靠性保障</Typography>
            {[
              { color: '#0066FF', bg: 'rgba(0,102,255,0.05)', title: '雙層模型架構', desc: '主模型 + 備援模型交叉驗證，結果更穩定' },
              { color: '#00C853', bg: 'rgba(0,200,83,0.05)', title: '持續數據更新', desc: '即時串接賽事數據，模型定期以最新數據校正' },
              { color: '#FFB300', bg: 'rgba(255,179,0,0.05)', title: '多源交叉驗證', desc: '多個數據源互相驗證，過濾異常數據干擾' },
            ].map((item) => (
              <Box key={item.title} sx={{
                borderLeft: `4px solid ${item.color}`, p: 2, mb: 1.5,
                background: item.bg, borderRadius: '0 8px 8px 0',
              }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}>{item.title}</Typography>
                <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
              </Box>
            ))}
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ Data Sources ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>數據來源</Typography>
        <Grid container spacing={3}>
          {DATA_SOURCES.map((src) => (
            <Grid item xs={12} sm={4} key={src.name}>
              <Box sx={{
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2,
                p: 3, background: '#141F2E', height: '100%',
              }}>
                <Box sx={{ mb: 1.5 }}>{src.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{src.name}</Typography>
                <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 600, display: 'block', mb: 1 }}>{src.subtitle}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>{src.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ Limitations ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Box sx={{ border: '1px solid rgba(255,165,0,0.25)', borderRadius: 2, p: 3, background: 'rgba(255,165,0,0.04)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <WarningIcon sx={{ color: '#FFB300', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFB300' }}>重要聲明</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              '本系統所有分析結果基於歷史數據統計，僅供參考，不構成任何投注建議',
              '運動賽事受傷病、天氣、臨場發揮等不可預測因素影響，任何預測均存在不確定性',
              '過去的預測表現不代表未來收益保證，請理性娛樂、量力而為',
              '未成年人請勿參與博彩活動，如有賭博問題請尋求專業協助',
            ].map((text, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <CheckCircleIcon sx={{ color: '#FFB300', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>{text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ══ FAQ ══ */}
      <Box sx={{ py: 8, px: { xs: 2, md: 0 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>常見問題</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {FAQS.map((faq, i) => (
            <Box key={i} sx={{
              border: `1px solid ${openFaq === i ? 'rgba(0,102,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 2, overflow: 'hidden', transition: 'border-color 0.25s',
            }}>
              <Box onClick={() => toggleFaq(i)} sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                px: 3, py: 2, cursor: 'pointer',
                background: openFaq === i ? 'rgba(0,102,255,0.04)' : 'transparent',
                '&:hover': { background: 'rgba(255,255,255,0.03)' },
                transition: 'background 0.2s', userSelect: 'none',
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>{faq.q}</Typography>
                <Typography sx={{
                  color: openFaq === i ? '#0066FF' : 'text.secondary',
                  fontSize: 20, lineHeight: 1, flexShrink: 0, ml: 2,
                  transition: 'transform 0.25s, color 0.25s',
                  transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
                }}>+</Typography>
              </Box>
              <Box sx={{ maxHeight: openFaq === i ? '300px' : '0px', overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ px: 3, py: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>{faq.a}</Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

    </Box>
  );
}
