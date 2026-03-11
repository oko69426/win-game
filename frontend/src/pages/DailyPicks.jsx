import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, CircularProgress, Alert,
  Divider, IconButton, Tooltip,
} from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { API_BASE } from '../services/api';
import RefreshIcon from '@mui/icons-material/Refresh';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BalanceIcon from '@mui/icons-material/Balance';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InboxIcon from '@mui/icons-material/Inbox';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const CONF_COLOR = { '高': '#0066FF', '中': '#FFB300', '低': '#F43B30' };

function PickCard({ pick }) {
  const { home_team, away_team, competition, match_time, prediction, confidence_score } = pick;
  const winner = prediction?.winner || {};
  const handicap = prediction?.handicap;
  const over_under = prediction?.over_under;
  const confColor = CONF_COLOR[prediction?.confidence_level] || '#666';

  // Format UTC time to local
  const formatTime = (utcStr) => {
    if (!utcStr) return '時間未知';
    try {
      return new Date(utcStr).toLocaleString('zh-TW', {
        month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
        hour12: false,
      });
    } catch {
      return utcStr;
    }
  };

  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.07)',
        background: '#141F2E',
        overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'rgba(0,102,255,0.2)',
          boxShadow: '0 0 24px rgba(0,102,255,0.08)',
          transform: 'translateY(-2px)',
        },
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, #00C853, #0066FF)',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Box
            sx={{
              px: 1, py: 0.3, borderRadius: '6px',
              background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.2)',
            }}
          >
            <Typography variant="caption" sx={{ color: '#00C853', fontWeight: 600, fontSize: '0.65rem' }}>
              <SportsSoccerIcon sx={{ fontSize: 10, mr: 0.4, verticalAlign: 'middle' }} />
              {competition}
            </Typography>
          </Box>
          <Box
            sx={{
              px: 1, py: 0.3, borderRadius: '6px',
              background: `${confColor}14`, border: `1px solid ${confColor}35`,
            }}
          >
            <Typography variant="caption" sx={{ color: confColor, fontWeight: 700, fontSize: '0.65rem' }}>
              信心 {confidence_score}%
            </Typography>
          </Box>
        </Box>

        {/* Teams */}
        <Grid container alignItems="center" spacing={0.5}>
          <Grid item xs={5} textAlign="center">
            <Typography fontWeight={800} sx={{ fontSize: '0.95rem', lineHeight: 1.3 }}>
              {home_team}
            </Typography>
            <Typography variant="caption" sx={{ color: '#0066FF', fontSize: '0.62rem' }}>主隊</Typography>
          </Grid>
          <Grid item xs={2} textAlign="center">
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.7rem' }}>VS</Typography>
          </Grid>
          <Grid item xs={5} textAlign="center">
            <Typography fontWeight={800} sx={{ fontSize: '0.95rem', lineHeight: 1.3 }}>
              {away_team}
            </Typography>
            <Typography variant="caption" sx={{ color: '#F43B30', fontSize: '0.62rem' }}>客隊</Typography>
          </Grid>
        </Grid>

        <Box display="flex" alignItems="center" gap={0.5} mt={1}>
          <AccessTimeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {formatTime(match_time)}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

      {/* Prediction data */}
      <Box sx={{ px: 2.5, py: 1.5 }}>
        {/* Win probabilities */}
        <Box display="flex" gap={0.8} mb={1.5}>
          {winner.home_win !== undefined && (
            <Box flex={1} textAlign="center" sx={{ background: 'rgba(0,102,255,0.06)', borderRadius: '8px', py: 1 }}>
              <Typography variant="body2" fontWeight={800} sx={{ color: '#0066FF', lineHeight: 1 }}>
                {winner.home_win}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>主勝</Typography>
            </Box>
          )}
          {winner.draw !== undefined && winner.draw > 0 && (
            <Box flex={1} textAlign="center" sx={{ background: 'rgba(255,165,2,0.06)', borderRadius: '8px', py: 1 }}>
              <Typography variant="body2" fontWeight={800} sx={{ color: '#FFB300', lineHeight: 1 }}>
                {winner.draw}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>平局</Typography>
            </Box>
          )}
          {winner.away_win !== undefined && (
            <Box flex={1} textAlign="center" sx={{ background: 'rgba(244,59,48,0.06)', borderRadius: '8px', py: 1 }}>
              <Typography variant="body2" fontWeight={800} sx={{ color: '#F43B30', lineHeight: 1 }}>
                {winner.away_win}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>客勝</Typography>
            </Box>
          )}
        </Box>

        {/* Recommendation badges */}
        <Box display="flex" gap={1} flexWrap="wrap">
          {prediction?.recommended && (
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1.2, py: 0.4, borderRadius: '6px',
                background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,102,255,0.25)',
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: 12, color: '#0066FF' }} />
              <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 700, fontSize: '0.68rem' }}>
                {prediction.recommended}
              </Typography>
            </Box>
          )}
          {handicap?.recommendation && (
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1.2, py: 0.4, borderRadius: '6px',
                background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.25)',
              }}
            >
              <BalanceIcon sx={{ fontSize: 11, color: '#00C853' }} />
              <Typography variant="caption" sx={{ color: '#00C853', fontWeight: 700, fontSize: '0.68rem' }}>
                {handicap.display}
              </Typography>
            </Box>
          )}
          {over_under?.recommendation && (
            <Box
              sx={{
                px: 1.2, py: 0.4, borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem' }}>
                {over_under.recommendation}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function DailyPicks() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPicks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/daily-picks`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError('無法載入每日精選，請確認後端服務已啟動');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPicks(); }, [fetchPicks]);

  const today = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 42, height: 42, borderRadius: '10px',
              background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,102,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <WhatshotIcon sx={{ color: '#0066FF', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: { xs: '1.6rem', md: '2.125rem' } }}>
              每日精選推薦
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {today} · AI 模型分析今日賽事
            </Typography>
          </Box>
        </Box>
        <Tooltip title="重新整理">
          <IconButton
            onClick={fetchPicks}
            sx={{
              color: '#0066FF', border: '1px solid rgba(0,102,255,0.25)',
              background: 'rgba(0,102,255,0.06)',
              '&:hover': { background: 'rgba(0,102,255,0.12)', boxShadow: '0 0 12px rgba(0,102,255,0.2)' },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Info banner */}
      <Box
        sx={{
          mb: 3, p: 2, borderRadius: '12px',
          background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.2)',
          display: 'flex', gap: 1.5, alignItems: 'flex-start',
        }}
      >
        <InfoOutlinedIcon sx={{ color: '#00C853', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
        <Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
            每日精選透過 Football-Data.org 取得今日賽程，自動執行 ML 模型預測，篩選出信心度最高的比賽供參考。
            資料每次點擊重新整理時更新，不構成投注建議。
          </Typography>
          {data?.demo && (
            <Typography variant="caption" sx={{ color: '#FFB300', mt: 0.5, display: 'block' }}>
              ⚠️ 目前為示範模式 — 設定 Football-Data API Key 可取得真實今日賽事
            </Typography>
          )}
        </Box>
      </Box>

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress sx={{ color: '#0066FF' }} />
        </Box>
      )}

      {/* Error */}
      {error && !loading && (
        <Alert
          severity="error"
          sx={{
            background: 'rgba(244,59,48,0.08)', border: '1px solid rgba(244,59,48,0.25)',
            borderRadius: '12px', '& .MuiAlert-icon': { color: '#F43B30' },
          }}
        >
          {error}
        </Alert>
      )}

      {/* Stats row */}
      {data && !loading && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          {[
            { label: '今日總場次', value: data.total_matches ?? '—' },
            { label: '精選推薦', value: data.picks?.length ?? 0 },
            { label: '監控聯賽', value: '6 大聯賽' },
          ].map(({ label, value }) => (
            <Box
              key={label}
              sx={{
                px: 2, py: 1.5, borderRadius: '10px',
                background: '#141F2E', border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ color: '#0066FF', lineHeight: 1 }}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Picks grid */}
      {data?.picks?.length > 0 && !loading && (
        <Grid container spacing={2}>
          {data.picks.map((pick, idx) => (
            <Grid item xs={12} sm={6} md={4} key={pick.match_id || idx}>
              <PickCard pick={pick} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty */}
      {data?.picks?.length === 0 && !loading && !error && (
        <Box
          textAlign="center" py={12}
          sx={{ borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', background: '#141F2E' }}
        >
          <InboxIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">今日暫無符合條件的精選賽事</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            可能今日無在監控聯賽中舉行的比賽，或所有場次信心度皆低於閾值
          </Typography>
        </Box>
      )}

      {/* Disclaimer */}
      <Box
        mt={4} p={2}
        sx={{
          borderRadius: '12px', background: 'rgba(244,59,48,0.04)',
          border: '1px solid rgba(244,59,48,0.15)',
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
          ⚠️ 以上推薦僅為 AI 模型基於統計數據之分析結果，不構成任何投注建議。
          運動賽事受傷病、天氣、裁判等多重不可預測因素影響，任何預測均存在不確定性。
          請理性娛樂，量力而為。未成年人請勿參與博彩活動。
        </Typography>
      </Box>
    </Box>
  );
}
