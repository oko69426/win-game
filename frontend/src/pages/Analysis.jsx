import React, { useState } from 'react';
import {
  Box, Typography, Divider, Alert, Button, Collapse
} from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import RefreshIcon from '@mui/icons-material/Refresh';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LanguageIcon from '@mui/icons-material/Language';
import HdIcon from '@mui/icons-material/Hd';

import UploadZone from '../components/UploadZone';
import ResultDisplay from '../components/ResultDisplay';
import DisclaimerBanner from '../components/DisclaimerBanner';

const TIPS = [
  { icon: <CameraAltIcon sx={{ fontSize: 20 }} />, title: '包含完整隊名', desc: '截圖需清楚顯示主客隊名稱，格式如「主隊 vs 客隊」' },
  { icon: <ShowChartIcon sx={{ fontSize: 20 }} />, title: '含賠率更準確', desc: '帶有賠率數字（如 1.75 / 3.50）可大幅提升預測精準度' },
  { icon: <LanguageIcon sx={{ fontSize: 20 }} />,  title: '多語言支援',   desc: '支援繁體中文、簡體中文及英文截圖自動辨識' },
  { icon: <HdIcon sx={{ fontSize: 20 }} />,        title: '高解析度優先', desc: '建議 720p 以上，確保文字清晰可讀，辨識準確率更高' },
];

export default function Analysis() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleResult = (data) => {
    setResult(data);
    setError('');
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box>
      {/* Page header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              background: 'rgba(0,102,255,0.1)',
              border: '1px solid rgba(0,102,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AnalyticsIcon sx={{ color: '#0066FF', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: { xs: '1.6rem', md: '2.125rem' } }}>
              AI 賽事分析
            </Typography>
            <Typography variant="body2" color="text.secondary">
              上傳比賽截圖，獲取 AI 驅動的數據分析與下注建議
            </Typography>
          </Box>
        </Box>
      </Box>

      <DisclaimerBanner compact />

      {/* Upload card */}
      <Box
        sx={{
          mb: 4,
          mt: 3,
          borderRadius: '16px',
          border: '1px solid rgba(0,102,255,0.15)',
          background: '#141F2E',
          overflow: 'hidden',
        }}
      >
        {/* Card header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <CameraAltIcon sx={{ color: '#0066FF', fontSize: 20 }} />
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>上傳賽事截圖</Typography>
            <Typography variant="caption" color="text.secondary">
              支援台灣運彩、威廉希爾、bet365 等平台截圖
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <UploadZone onResult={handleResult} />
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            background: 'rgba(244,59,48,0.08)',
            border: '1px solid rgba(244,59,48,0.25)',
            '& .MuiAlert-icon': { color: '#F43B30' },
          }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Result */}
      <Collapse in={!!result}>
        <Box id="result-section">
          <Divider sx={{ mb: 3, borderColor: 'rgba(0,102,255,0.15)' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                px: 2,
                py: 0.5,
                borderRadius: '20px',
                background: 'rgba(0,102,255,0.08)',
                border: '1px solid rgba(0,102,255,0.2)',
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 14, color: '#0066FF' }} />
              <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 700, letterSpacing: '0.06em' }}>
                分析完成
              </Typography>
            </Box>
          </Divider>

          {result && <ResultDisplay result={result} />}

          <Box display="flex" justifyContent="center" mt={5}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              size="large"
              sx={{
                px: 4,
                py: 1.2,
                borderColor: 'rgba(0,102,255,0.35)',
                color: '#0066FF',
                '&:hover': {
                  borderColor: '#0066FF',
                  background: 'rgba(0,102,255,0.06)',
                  boxShadow: '0 0 16px rgba(0,102,255,0.2)',
                },
              }}
            >
              重新分析另一場比賽
            </Button>
          </Box>
        </Box>
      </Collapse>

      {/* Tips (shown when no result) */}
      {!result && (
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.1em' }}>
            截圖建議
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 2,
              mt: 1.5,
            }}
          >
            {TIPS.map(({ icon, title, desc }) => (
              <Box
                key={title}
                sx={{
                  p: 2.5,
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: '#141F2E',
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    borderColor: 'rgba(0,102,255,0.2)',
                  },
                }}
              >
                <Box sx={{ color: '#0066FF', mb: 1.5, display: 'flex' }}>{icon}</Box>
                <Typography variant="body2" fontWeight={700} mb={0.5}>{title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  {desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
