import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, CircularProgress, Alert,
  Divider, IconButton, Tooltip
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { API_BASE } from '../services/api';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import RefreshIcon from '@mui/icons-material/Refresh';
import InboxIcon from '@mui/icons-material/Inbox';

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/history?limit=20`);
      if (!res.ok) throw new Error('載入失敗');
      const data = await res.json();
      setRecords(data.data || []);
    } catch {
      setError('無法載入歷史記錄，請確認後端服務已啟動');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const formatTime = (ts) => {
    if (!ts) return '未知時間';
    return new Date(ts * 1000).toLocaleString('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center" gap={1.5}>
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
            <HistoryIcon sx={{ color: '#0066FF', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: { xs: '1.6rem', md: '2.125rem' } }}>
              歷史分析記錄
            </Typography>
            <Typography variant="body2" color="text.secondary">
              共 {records.length} 筆記錄
            </Typography>
          </Box>
        </Box>
        <Tooltip title="重新整理">
          <IconButton
            onClick={fetchHistory}
            sx={{
              color: '#0066FF',
              border: '1px solid rgba(0,102,255,0.25)',
              background: 'rgba(0,102,255,0.06)',
              '&:hover': {
                background: 'rgba(0,102,255,0.12)',
                boxShadow: '0 0 12px rgba(0,102,255,0.2)',
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress sx={{ color: '#0066FF' }} />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          sx={{
            background: 'rgba(244,59,48,0.08)',
            border: '1px solid rgba(244,59,48,0.25)',
            borderRadius: '12px',
            '& .MuiAlert-icon': { color: '#F43B30' },
          }}
        >
          {error}
        </Alert>
      )}

      {/* Empty */}
      {!loading && records.length === 0 && !error && (
        <Box
          textAlign="center"
          py={12}
          sx={{
            borderRadius: '16px',
            border: '1px dashed rgba(255,255,255,0.1)',
            background: '#141F2E',
          }}
        >
          <InboxIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">尚無分析記錄</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            前往「AI 分析」頁面上傳截圖開始分析
          </Typography>
        </Box>
      )}

      {/* Records grid */}
      <Grid container spacing={2}>
        {records.map((rec) => {
          const pred = rec.prediction || {};
          const winner = pred.winner || {};
          const SportIcon = rec.sport_type === 'baseball' ? SportsBaseballIcon : SportsSoccerIcon;

          return (
            <Grid item xs={12} sm={6} md={4} key={rec.id}>
              <Box
                sx={{
                  height: '100%',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: '#141F2E',
                  p: 2.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'rgba(0,102,255,0.2)',
                    boxShadow: '0 0 20px rgba(0,102,255,0.08)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {/* Top row */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box
                    sx={{
                      px: 1.2,
                      py: 0.3,
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      #{rec.id}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <SportIcon sx={{ fontSize: 15, color: '#0066FF' }} />
                    <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 600 }}>
                      {rec.sport_type === 'baseball' ? '棒球' : '足球'}
                    </Typography>
                  </Box>
                </Box>

                {/* Teams */}
                <Typography variant="subtitle1" fontWeight={800} mb={0.3} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {rec.home_team || '?'}
                  <Box component="span" sx={{ color: 'rgba(255,255,255,0.3)', mx: 0.8, fontWeight: 400 }}>vs</Box>
                  {rec.away_team || '?'}
                </Typography>

                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  {formatTime(rec.created_at)}
                </Typography>

                <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

                {/* Recommendation badge */}
                {pred.recommended && (
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">推薦: </Typography>
                    <Box
                      component="span"
                      sx={{
                        ml: 0.5,
                        px: 1.2,
                        py: 0.3,
                        borderRadius: '6px',
                        background: 'rgba(0,102,255,0.1)',
                        border: '1px solid rgba(0,102,255,0.25)',
                        color: '#0066FF',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        display: 'inline-block',
                      }}
                    >
                      {pred.recommended}
                    </Box>
                  </Box>
                )}

                {/* Probability summary */}
                <Box display="flex" gap={1}>
                  {winner.home_win !== undefined && (
                    <Box flex={1} textAlign="center" sx={{ background: 'rgba(0,102,255,0.06)', borderRadius: '8px', p: 1 }}>
                      <Typography variant="h6" sx={{ color: '#0066FF', fontWeight: 800, lineHeight: 1 }}>
                        {winner.home_win}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">主勝</Typography>
                    </Box>
                  )}
                  {winner.draw !== undefined && rec.sport_type !== 'baseball' && (
                    <Box flex={1} textAlign="center" sx={{ background: 'rgba(255,165,2,0.06)', borderRadius: '8px', p: 1 }}>
                      <Typography variant="h6" sx={{ color: '#FFB300', fontWeight: 800, lineHeight: 1 }}>
                        {winner.draw}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">平局</Typography>
                    </Box>
                  )}
                  {winner.away_win !== undefined && (
                    <Box flex={1} textAlign="center" sx={{ background: 'rgba(244,59,48,0.06)', borderRadius: '8px', p: 1 }}>
                      <Typography variant="h6" sx={{ color: '#F43B30', fontWeight: 800, lineHeight: 1 }}>
                        {winner.away_win}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">客勝</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
