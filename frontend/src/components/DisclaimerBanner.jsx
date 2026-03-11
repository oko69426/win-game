import React from 'react';
import { Box, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function DisclaimerBanner({ compact = false }) {
  if (compact) {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        sx={{
          mb: 2,
          px: 2,
          py: 1,
          borderRadius: '8px',
          background: 'rgba(255,165,2,0.06)',
          border: '1px solid rgba(255,165,2,0.2)',
        }}
      >
        <WarningAmberIcon sx={{ fontSize: 15, color: '#FFB300', flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,165,2,0.85)' }}>
          以下預測<strong>僅供參考</strong>，不構成投注建議。請理性娛樂，量力而為。
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mb: 3,
        px: 2.5,
        py: 2,
        borderRadius: '12px',
        background: 'rgba(255,165,2,0.06)',
        border: '1px solid rgba(255,165,2,0.2)',
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        <WarningAmberIcon sx={{ fontSize: 16, color: '#FFB300' }} />
        <Typography variant="body2" sx={{ color: '#FFB300', fontWeight: 700 }}>
          重要免責聲明
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'rgba(255,165,2,0.8)', lineHeight: 1.6 }}>
        本系統提供之預測結果<strong>僅供學術參考，不構成任何投注建議</strong>。
        運動結果受多種不可預測因素影響，任何統計模型均無法保證準確性。
        請理性娛樂，量力而為，切勿超出個人財務能力進行投注。
      </Typography>
    </Box>
  );
}
