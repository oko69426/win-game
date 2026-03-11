import React from 'react';
import { Box, Typography, Divider, Grid } from '@mui/material';
import { Link } from 'react-router-dom';

const LINKS = [
  { label: '首頁', to: '/' },
  { label: 'AI 分析', to: '/analysis' },
  { label: '歷史記錄', to: '/history' },
  { label: '每日精選', to: '/daily-picks' },
  { label: '預測績效', to: '/performance' },
  { label: '方法論', to: '/methodology' },
];

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid rgba(0,102,255,0.12)',
        mt: 'auto',
        pt: { xs: 5, md: 7 },
        pb: 4,
        px: { xs: 2, md: 6 },
        background: '#0A1628',
      }}
    >
      <Grid container spacing={4}>
        {/* Brand */}
        <Grid item xs={12} md={4}>
          <Box display="flex" alignItems="center" gap={1.2} mb={1.5}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '8px',
              background: 'linear-gradient(135deg, #0A1628, #0066FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(0,102,255,0.35)',
              flexShrink: 0,
            }}>
              <img
                src="/brand-assets/wingame-icon.svg"
                alt=""
                style={{ width: 20, height: 18, filter: 'brightness(0) invert(1)', display: 'block' }}
              />
            </Box>
            <Box>
              <Typography sx={{
                fontWeight: 900, letterSpacing: '0.06em',
                background: 'linear-gradient(90deg, #0066FF, #00D4FF 60%, #00C853)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: '0.95rem', lineHeight: 1.1,
              }}>
                WINGAME
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.55rem', letterSpacing: '0.14em' }}>
                AI SPORTS ANALYTICS
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" lineHeight={1.8} maxWidth={280}>
            通過精準、數據驅動的人工智能洞察，賦能體育愛好者，實現卓越分析表現。
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(0,102,255,0.6)', mt: 1, display: 'block' }}>
            www.wingameai.com
          </Typography>
        </Grid>

        {/* Links */}
        <Grid item xs={6} md={2}>
          <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', mb: 2 }}>
            功能
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.2}>
            {LINKS.map(({ label, to }) => (
              <Box
                key={to}
                component={Link}
                to={to}
                sx={{
                  color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.875rem',
                  transition: 'color 0.2s',
                  '&:hover': { color: '#0066FF' },
                }}
              >
                {label}
              </Box>
            ))}
          </Box>
        </Grid>

        {/* Data Sources */}
        <Grid item xs={6} md={3}>
          <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', mb: 2 }}>
            數據來源
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.2}>
            {['Football-Data.org', 'MLB Stats API', 'TheSportsDB', 'DashScope Qwen AI'].map((s) => (
              <Typography key={s} variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {s}
              </Typography>
            ))}
          </Box>
        </Grid>

        {/* Tech */}
        <Grid item xs={12} md={3}>
          <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', mb: 2 }}>
            技術棧
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.2}>
            {['XGBoost ML Model', 'EasyOCR 文字識別', 'React + Material-UI', 'Flask REST API'].map((s) => (
              <Typography key={s} variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {s}
              </Typography>
            ))}
          </Box>
          <Box
            mt={2}
            sx={{
              display: 'inline-flex', px: 1.5, py: 0.5, borderRadius: '20px',
              background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,102,255,0.2)',
            }}
          >
            <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 700, letterSpacing: '0.08em' }}>
              BETA v1.0
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.06)' }} />

      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.5 }}>
          © {new Date().getFullYear()} WINGAME AI Sports Analytics · 版權所有
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.4, maxWidth: 480, lineHeight: 1.6 }}>
          ⚠️ 本系統所有預測結果僅供娛樂參考，不構成任何投注建議。請理性娛樂，量力而為。
        </Typography>
      </Box>
    </Box>
  );
}
