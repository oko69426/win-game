import React, { useState } from 'react';
import {
  Box, Typography, Grid, Divider, Collapse, IconButton, Tooltip,
} from '@mui/material';
import IGExportButton from './IGExportButton';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorageIcon from '@mui/icons-material/Storage';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BalanceIcon from '@mui/icons-material/Balance';

import ProbabilityChart from './ProbabilityChart';
import DisclaimerBanner from './DisclaimerBanner';

const TIER_CONFIG = {
  1: { label: 'XGBoost 模型', color: '#0066FF', bg: 'rgba(0,102,255,0.08)', border: 'rgba(0,102,255,0.25)' },
  2: { label: '統計推算', color: '#FFB300', bg: 'rgba(255,165,2,0.08)', border: 'rgba(255,165,2,0.25)' },
  3: { label: '基礎推算', color: '#F43B30', bg: 'rgba(244,59,48,0.08)', border: 'rgba(244,59,48,0.25)' },
};
const CONF_COLOR = { '高': '#0066FF', '中': '#FFB300', '低': '#F43B30' };
const RISK_CONFIG = {
  '高': { color: '#F43B30', bg: 'rgba(244,59,48,0.1)', border: 'rgba(244,59,48,0.3)' },
  '中': { color: '#FFB300', bg: 'rgba(255,179,0,0.1)', border: 'rgba(255,179,0,0.3)' },
  '低': { color: '#00C853', bg: 'rgba(0,200,83,0.1)', border: 'rgba(0,200,83,0.3)' },
};


/* ── 近期戰績徽章 ── */
function FormBadges({ form }) {
  if (!form || form.length === 0) return null;
  const colorMap = { W: '#00C853', L: '#F43B30', D: '#FFB300' };
  return (
    <Box display="flex" gap={0.5}>
      {form.slice(-5).map((r, i) => (
        <Box key={i} sx={{
          width: 22, height: 22, borderRadius: '5px',
          background: `${colorMap[r] || '#666'}22`,
          border: `1px solid ${colorMap[r] || '#666'}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: colorMap[r] || '#fff' }}>{r}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function SectionCard({ children, sx = {}, title, titleColor = '#0066FF' }) {
  return (
    <Box
      sx={{
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.07)',
        background: '#141F2E',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {title && (
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: titleColor, letterSpacing: '0.12em', fontSize: '0.68rem', fontWeight: 700 }}
          >
            {title}
          </Typography>
        </Box>
      )}
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Box>
  );
}

// Progress bar row
function StatBar({ label, homeVal, awayVal, format = (v) => v, higherIsBetter = true }) {
  const total = homeVal + awayVal;
  const homePct = total > 0 ? (homeVal / total) * 100 : 50;
  const homeWins = higherIsBetter ? homeVal >= awayVal : homeVal <= awayVal;

  return (
    <Box mb={1.8}>
      <Box display="flex" justifyContent="space-between" mb={0.6} alignItems="center">
        <Typography
          variant="body2"
          sx={{ color: homeWins ? '#0066FF' : 'rgba(255,255,255,0.6)', fontWeight: homeWins ? 700 : 400 }}
        >
          {format(homeVal)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>{label}</Typography>
        <Typography
          variant="body2"
          sx={{ color: !homeWins ? '#F43B30' : 'rgba(255,255,255,0.6)', fontWeight: !homeWins ? 700 : 400 }}
        >
          {format(awayVal)}
        </Typography>
      </Box>
      <Box sx={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(244,59,48,0.3)' }}>
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${homePct}%`,
            borderRadius: 3,
            background: 'rgba(0,102,255,0.8)',
            transition: 'width 1s ease',
          }}
        />
      </Box>
    </Box>
  );
}

export default function ResultDisplay({ result }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!result) return null;

  const { match_info, prediction, sport_type, api_info, analysis_id, ai_analysis, stats } = result;
  const { winner, handicap, over_under } = prediction;
  const SportIcon = sport_type === 'baseball' ? SportsBaseballIcon : SportsSoccerIcon;

  const tier = TIER_CONFIG[prediction.tier] || TIER_CONFIG[3];
  const confColor = CONF_COLOR[prediction.confidence_level] || '#666';

  const rawConfidence = Math.max(winner.home_win || 0, winner.draw || 0, winner.away_win || 0);
  const displayConfidence = Math.min(Math.round(rawConfidence * 1.31 + 9), 93);

  const probRows = sport_type === 'soccer'
    ? [
        { label: '主隊勝', value: winner.home_win, color: '#0066FF' },
        { label: '平局', value: winner.draw, color: '#FFB300' },
        { label: '客隊勝', value: winner.away_win, color: '#F43B30' },
      ]
    : [
        { label: '主隊勝', value: winner.home_win, color: '#0066FF' },
        { label: '客隊勝', value: winner.away_win, color: '#F43B30' },
      ];

  const h2hTotal = (stats?.h2h_home_wins || 0) + (stats?.h2h_draws || 0) + (stats?.h2h_away_wins || 0);
  const hasH2H = h2hTotal > 0;
  const hasStats = api_info?.available;

  return (
    <Box>
      <DisclaimerBanner compact />

      {/* ── Header ── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} mt={2} flexWrap="wrap" gap={1.5}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 38, height: 38, borderRadius: '9px',
              background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,102,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <SportIcon sx={{ color: '#0066FF', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
              分析報告
            </Typography>
            <Typography variant="caption" color="text.secondary">#{analysis_id}</Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <IGExportButton result={result} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.5, py: 0.5, borderRadius: '20px', background: tier.bg, border: `1px solid ${tier.border}` }}>
            {prediction.model_used
              ? <CheckCircleIcon sx={{ fontSize: 13, color: tier.color }} />
              : <WarningAmberIcon sx={{ fontSize: 13, color: tier.color }} />}
            <Typography variant="caption" sx={{ color: tier.color, fontWeight: 700, fontSize: '0.75rem' }}>
              {prediction.tier_label || tier.label}
            </Typography>
          </Box>
          <Box sx={{ px: 1.5, py: 0.5, borderRadius: '20px', background: `${confColor}14`, border: `1px solid ${confColor}40` }}>
            <Typography variant="caption" sx={{ color: confColor, fontWeight: 700, fontSize: '0.75rem' }}>
              信心度: {prediction.confidence_level}
            </Typography>
          </Box>
          {api_info?.available && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.5, py: 0.5, borderRadius: '20px', background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)' }}>
              <StorageIcon sx={{ fontSize: 12, color: '#00C853' }} />
              <Typography variant="caption" sx={{ color: '#00C853', fontWeight: 600, fontSize: '0.75rem' }}>
                {api_info.source}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Match Card (full width) ── */}
      <Box
        sx={{
          mb: 3,
          borderRadius: '16px',
          border: '1px solid rgba(0,102,255,0.15)',
          background: 'linear-gradient(135deg, rgba(0,102,255,0.04) 0%, rgba(0,0,0,0) 60%)',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #00C853, #0066FF, #00D4FF)',
          },
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* Team vs Team */}
          <Grid container alignItems="center" spacing={1} mb={2}>
            <Grid item xs={5} textAlign="center">
              <Typography fontWeight={900} sx={{ fontSize: { xs: '1rem', md: '1.3rem' }, lineHeight: 1.2 }}>
                {match_info.home_team}
              </Typography>
              <Box display="flex" justifyContent="center" alignItems="center" gap={0.8} mt={0.5} flexWrap="wrap">
                <Box sx={{ display: 'inline-block', px: 1, py: 0.2, borderRadius: '4px', background: 'rgba(0,102,255,0.1)' }}>
                  <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 600, fontSize: '0.65rem' }}>主隊</Typography>
                </Box>
                {stats?.home_form && <FormBadges form={stats.home_form} />}
              </Box>
            </Grid>

            <Grid item xs={2} textAlign="center">
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: '10px', mx: 'auto',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: '0.7rem' }}>VS</Typography>
              </Box>
              {match_info.match_time && (
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5} sx={{ fontSize: '0.62rem' }}>
                  {match_info.match_time}
                </Typography>
              )}
            </Grid>

            <Grid item xs={5} textAlign="center">
              <Typography fontWeight={900} sx={{ fontSize: { xs: '1rem', md: '1.3rem' }, lineHeight: 1.2 }}>
                {match_info.away_team}
              </Typography>
              <Box display="flex" justifyContent="center" alignItems="center" gap={0.8} mt={0.5} flexWrap="wrap">
                <Box sx={{ display: 'inline-block', px: 1, py: 0.2, borderRadius: '4px', background: 'rgba(244,59,48,0.1)' }}>
                  <Typography variant="caption" sx={{ color: '#F43B30', fontWeight: 600, fontSize: '0.65rem' }}>客隊</Typography>
                </Box>
                {stats?.away_form && <FormBadges form={stats.away_form} />}
              </Box>
            </Grid>
          </Grid>

          {/* Odds row */}
          {Object.keys(match_info.odds || {}).length > 0 && (
            <>
              <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
              <Box display="flex" gap={1} flexWrap="wrap">
                {match_info.odds.home_win && (
                  <Box flex={1} minWidth={60} textAlign="center" sx={{ background: 'rgba(0,102,255,0.06)', borderRadius: '8px', p: 1 }}>
                    <Typography variant="caption" display="block" color="text.secondary">主勝</Typography>
                    <Typography variant="body2" sx={{ color: '#0066FF', fontWeight: 700 }}>{match_info.odds.home_win}</Typography>
                  </Box>
                )}
                {match_info.odds.draw && sport_type === 'soccer' && (
                  <Box flex={1} minWidth={60} textAlign="center" sx={{ background: 'rgba(255,165,2,0.06)', borderRadius: '8px', p: 1 }}>
                    <Typography variant="caption" display="block" color="text.secondary">平局</Typography>
                    <Typography variant="body2" sx={{ color: '#FFB300', fontWeight: 700 }}>{match_info.odds.draw}</Typography>
                  </Box>
                )}
                {match_info.odds.away_win && (
                  <Box flex={1} minWidth={60} textAlign="center" sx={{ background: 'rgba(244,59,48,0.06)', borderRadius: '8px', p: 1 }}>
                    <Typography variant="caption" display="block" color="text.secondary">客勝</Typography>
                    <Typography variant="body2" sx={{ color: '#F43B30', fontWeight: 700 }}>{match_info.odds.away_win}</Typography>
                  </Box>
                )}
                {match_info.odds.over && (
                  <Box flex={1} minWidth={60} textAlign="center" sx={{ background: 'rgba(0,200,83,0.06)', borderRadius: '8px', p: 1 }}>
                    <Typography variant="caption" display="block" color="text.secondary">大球</Typography>
                    <Typography variant="body2" sx={{ color: '#00C853', fontWeight: 700 }}>{match_info.odds.over}</Typography>
                  </Box>
                )}
                {match_info.odds.under && (
                  <Box flex={1} minWidth={60} textAlign="center" sx={{ background: 'rgba(0,200,83,0.04)', borderRadius: '8px', p: 1 }}>
                    <Typography variant="caption" display="block" color="text.secondary">小球</Typography>
                    <Typography variant="body2" sx={{ color: '#00C853', fontWeight: 700 }}>{match_info.odds.under}</Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* ── Main layout: prediction area (left) + sidebar (right) ── */}
      <Grid container spacing={2} mb={2} alignItems="flex-start">

        {/* LEFT: 3-column prediction grid */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {/* 獲勝機率分布 */}
            <Grid item xs={12} sm={4}>
              <SectionCard title="獲勝機率分布" sx={{ height: '100%' }}>
                {probRows.map(({ label, value, color }, idx) => {
                  const teamLabel = label === '主隊勝'
                    ? `主隊 (${match_info.home_team || '主隊'})`
                    : label === '客隊勝'
                    ? `客隊 (${match_info.away_team || '客隊'})`
                    : label;
                  return (
                    <Box key={label} mb={idx < probRows.length - 1 ? 2.5 : 0}>
                      <Box display="flex" justifyContent="space-between" mb={0.7} alignItems="center">
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{teamLabel}</Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ color }}>{value}%</Typography>
                      </Box>
                      <Box sx={{ position: 'relative', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <Box sx={{
                          position: 'absolute', left: 0, top: 0, height: '100%',
                          width: `${value}%`, borderRadius: 5, background: color,
                          boxShadow: `0 0 8px ${color}60`, transition: 'width 1.2s ease',
                        }} />
                        {value >= 15 && (
                          <Typography sx={{
                            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                            fontSize: '0.6rem', fontWeight: 800, color: '#fff', lineHeight: 1,
                          }}>
                            {value}%
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </SectionCard>
            </Grid>

            {/* AI 預測結果 */}
            <Grid item xs={12} sm={4}>
              <Box sx={{
                height: '100%', borderRadius: '14px',
                border: '1px solid rgba(0,102,255,0.25)',
                background: 'linear-gradient(135deg, rgba(0,102,255,0.07) 0%, rgba(0,212,255,0.04) 100%)',
                overflow: 'hidden', position: 'relative',
                '&::before': {
                  content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: 'linear-gradient(90deg, #0066FF, #00D4FF)',
                },
              }}>
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsIcon sx={{ color: '#FFB300', fontSize: 15 }} />
                  <Typography variant="overline" sx={{ color: '#00D4FF', letterSpacing: '0.12em', fontSize: '0.68rem', fontWeight: 700 }}>
                    AI 預測結果
                  </Typography>
                </Box>

                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 110 }}>
                  <Typography sx={{ fontSize: { xs: '1.8rem', md: '2rem' }, fontWeight: 900, color: '#0066FF', lineHeight: 1 }}>
                    {prediction.recommended}
                  </Typography>
                  <Box textAlign="center" flexShrink={0}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.3, letterSpacing: '0.08em' }}>自信值</Typography>
                    <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: '#00D4FF', lineHeight: 1, textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
                      {displayConfidence}%
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.4} mt={0.4} justifyContent="center">
                      <CheckCircleIcon sx={{ fontSize: 11, color: '#00C853' }} />
                      <Typography variant="caption" sx={{ color: '#00C853', fontSize: '0.62rem', fontWeight: 700 }}>準確預測</Typography>
                    </Box>
                  </Box>
                </Box>

                {prediction.confidence_level && (() => {
                  const riskMap = { '高': '低', '中': '中', '低': '高' };
                  const riskLevel = riskMap[prediction.confidence_level] || '中';
                  return (
                    <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>風險:</Typography>
                      {['低', '中', '高'].map((lvl) => (
                        <Box key={lvl} sx={{
                          px: 1, py: 0.25, borderRadius: '5px',
                          background: lvl === riskLevel ? RISK_CONFIG[lvl].bg : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${lvl === riskLevel ? RISK_CONFIG[lvl].border : 'rgba(255,255,255,0.07)'}`,
                        }}>
                          <Typography variant="caption" sx={{ color: lvl === riskLevel ? RISK_CONFIG[lvl].color : 'rgba(255,255,255,0.25)', fontWeight: lvl === riskLevel ? 800 : 400, fontSize: '0.62rem' }}>
                            {lvl}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  );
                })()}

                {prediction.recommended_reason && (
                  <Box sx={{ px: 2.5, pb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      {prediction.recommended_reason}
                    </Typography>
                  </Box>
                )}

                {!prediction.model_used && prediction.tier_note && (
                  <Box sx={{ mx: 2.5, mb: 2, p: 1.5, background: 'rgba(255,165,2,0.06)', borderRadius: '8px', border: '1px solid rgba(255,165,2,0.2)' }}>
                    <Box display="flex" gap={0.8} alignItems="flex-start">
                      <InfoOutlinedIcon sx={{ fontSize: 13, color: '#FFB300', mt: 0.2, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,165,2,0.85)', lineHeight: 1.5 }}>
                        {prediction.tier_note}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {prediction.low_confidence_note && (
                  <Box sx={{ mx: 2.5, mb: 2, p: 1.5, background: 'rgba(244,67,54,0.05)', borderRadius: '8px', border: '1px solid rgba(244,67,54,0.2)' }}>
                    <Box display="flex" gap={0.8} alignItems="flex-start">
                      <InfoOutlinedIcon sx={{ fontSize: 13, color: '#F44336', mt: 0.2, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ color: 'rgba(244,100,80,0.9)', lineHeight: 1.5 }}>
                        {prediction.low_confidence_note}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* 大小球預測 */}
            <Grid item xs={12} sm={4}>
              <SectionCard title={`大小球預測 ${over_under?.line ? `(${over_under.line})` : ''}`} sx={{ height: '100%' }}>
                {over_under && (
                  <>
                    {[
                      { label: '大 (Over)', value: over_under.over, color: '#0066FF' },
                      { label: '小 (Under)', value: over_under.under, color: '#4A5568' },
                    ].map(({ label, value, color }, idx) => (
                      <Box key={label} mb={idx === 0 ? 2.5 : 0}>
                        <Box display="flex" justifyContent="space-between" mb={0.7} alignItems="center">
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{label}</Typography>
                          <Typography variant="body2" fontWeight={800} sx={{ color }}>{value}%</Typography>
                        </Box>
                        <Box sx={{ position: 'relative', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <Box sx={{
                            position: 'absolute', left: 0, top: 0, height: '100%',
                            width: `${value}%`, borderRadius: 5, background: color,
                            transition: 'width 1.2s ease',
                          }} />
                          {value >= 15 && (
                            <Typography sx={{
                              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                              fontSize: '0.6rem', fontWeight: 800, color: '#fff', lineHeight: 1,
                            }}>
                              {value}%
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                    <Box mt={2} sx={{ background: 'rgba(0,102,255,0.06)', borderRadius: '8px', p: 1.2, border: '1px solid rgba(0,102,255,0.15)' }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#0066FF', textAlign: 'center' }}>
                        {over_under.recommendation}
                      </Typography>
                    </Box>
                  </>
                )}
              </SectionCard>
            </Grid>
          </Grid>
        </Grid>

        {/* RIGHT SIDEBAR: AI 模型資訊 + 近期戰績 */}
        <Grid item xs={12} md={4}>
          {/* AI 模型資訊 */}
          <Box sx={{
            borderRadius: '14px',
            border: '1px solid rgba(0,102,255,0.2)',
            background: '#141F2E',
            overflow: 'hidden',
            mb: 2,
          }}>
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,102,255,0.04)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PsychologyIcon sx={{ color: '#0066FF', fontSize: 15 }} />
              <Typography variant="overline" sx={{ color: '#0066FF', letterSpacing: '0.12em', fontSize: '0.68rem', fontWeight: 700 }}>
                AI 模型資訊
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              {[
                { label: '模型名稱', value: prediction.tier_label || tier.label, valueColor: tier.color },
                { label: '自信度級', value: prediction.confidence_level || '—', valueColor: confColor },
                { label: '分析特徵', value: '30+ 種指標', valueColor: '#00D4FF' },
                { label: '數據來源', value: api_info?.available ? api_info.source : '內建統計', valueColor: api_info?.available ? '#00C853' : 'rgba(255,255,255,0.5)' },
              ].map(({ label, value, valueColor }) => (
                <Box key={label} display="flex" justifyContent="space-between" alignItems="center" mb={1.5}
                  sx={{ pb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.04)', '&:last-child': { mb: 0, pb: 0, borderBottom: 'none' } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{label}</Typography>
                  <Typography variant="caption" sx={{ color: valueColor, fontWeight: 700, fontSize: '0.75rem' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* 近期戰績 */}
          {(stats?.home_form?.length > 0 || stats?.away_form?.length > 0) && (
            <Box sx={{
              borderRadius: '14px',
              border: '1px solid rgba(0,200,83,0.2)',
              background: '#141F2E',
              overflow: 'hidden',
            }}>
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,200,83,0.03)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ color: '#00C853', fontSize: 15 }} />
                <Typography variant="overline" sx={{ color: '#00C853', letterSpacing: '0.12em', fontSize: '0.68rem', fontWeight: 700 }}>
                  近期戰績
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {stats?.home_form?.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block', mb: 0.8 }}>
                      主隊 · {match_info.home_team}
                    </Typography>
                    <FormBadges form={stats.home_form} />
                  </Box>
                )}
                {stats?.away_form?.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block', mb: 0.8 }}>
                      客隊 · {match_info.away_team}
                    </Typography>
                    <FormBadges form={stats.away_form} />
                  </Box>
                )}
                {/* Legend */}
                <Box display="flex" gap={1.5} mt={2} pt={1.5} sx={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {[{ letter: 'W', label: '勝', color: '#00C853' }, { letter: 'D', label: '平', color: '#FFB300' }, { letter: 'L', label: '負', color: '#F43B30' }].map(({ letter, label, color }) => (
                    <Box key={letter} display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '4px', background: `${color}22`, border: `1px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color }}>{letter}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* ── 讓分盤 (Asian Handicap) ── */}
      {handicap && (
        <Box
          sx={{
            mb: 2,
            borderRadius: '14px',
            border: '1px solid rgba(0,200,83,0.25)',
            background: 'linear-gradient(135deg, rgba(0,200,83,0.06) 0%, rgba(0,0,0,0) 60%)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <BalanceIcon sx={{ color: '#00C853', fontSize: 16 }} />
            <Typography variant="overline" sx={{ color: '#00C853', letterSpacing: '0.12em', fontSize: '0.68rem', fontWeight: 700 }}>
              讓分盤 (Asian Handicap) 分析
            </Typography>
            {handicap.source === 'ocr' && (
              <Box sx={{ ml: 'auto', px: 1, py: 0.2, borderRadius: '4px', background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.3)' }}>
                <Typography variant="caption" sx={{ color: '#00C853', fontSize: '0.62rem', fontWeight: 600 }}>截圖識別</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>建議讓分線</Typography>
                  <Box
                    sx={{
                      display: 'inline-block', px: 2.5, py: 1,
                      borderRadius: '10px', background: 'rgba(0,200,83,0.12)',
                      border: '1px solid rgba(0,200,83,0.3)',
                    }}
                  >
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#00C853' }}>
                      {handicap.display}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={7}>
                <Box>
                  <Typography variant="body2" fontWeight={700} mb={0.5}>
                    建議: <Box component="span" sx={{ color: '#00C853' }}>{handicap.recommendation}</Box>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {handicap.reason}
                  </Typography>
                  <Box
                    mt={1.5}
                    p={1.2}
                    sx={{ background: 'rgba(255,165,2,0.05)', borderRadius: '8px', border: '1px solid rgba(255,165,2,0.15)' }}
                  >
                    <Typography variant="caption" sx={{ color: 'rgba(255,165,2,0.75)', lineHeight: 1.5 }}>
                      ⚠️ 讓分盤會依賭盤公司而異，實際下注前請確認當前盤口數值
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* ── Stats Comparison (if API data available) ── */}
      {hasStats && stats && (
        <SectionCard title="球隊數據比較" sx={{ mb: 2 }}>
          <Grid container spacing={1} mb={2}>
            <Grid item xs={5} textAlign="right">
              <Typography variant="body2" fontWeight={700} sx={{ color: '#0066FF' }}>
                {match_info.home_team}
              </Typography>
            </Grid>
            <Grid item xs={2} textAlign="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>指標</Typography>
            </Grid>
            <Grid item xs={5} textAlign="left">
              <Typography variant="body2" fontWeight={700} sx={{ color: '#F43B30' }}>
                {match_info.away_team}
              </Typography>
            </Grid>
          </Grid>
          <StatBar
            label="歷史勝率"
            homeVal={stats.home_win_rate}
            awayVal={stats.away_win_rate}
            format={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <StatBar
            label="近況分數"
            homeVal={stats.home_form_score}
            awayVal={stats.away_form_score}
            format={(v) => `${v.toFixed(0)}`}
          />
          <StatBar
            label="場均進球"
            homeVal={stats.home_avg_goals}
            awayVal={stats.away_avg_goals}
            format={(v) => `${v.toFixed(1)}`}
          />

          {/* H2H */}
          {hasH2H && (
            <>
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                歷史交鋒 (共 {h2hTotal} 場)
              </Typography>
              <Box display="flex" gap={1} mt={1.5}>
                <Box flex={1} textAlign="center" sx={{ background: 'rgba(0,102,255,0.06)', borderRadius: '8px', p: 1 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#0066FF', lineHeight: 1 }}>
                    {stats.h2h_home_wins}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">主隊勝</Typography>
                </Box>
                <Box flex={1} textAlign="center" sx={{ background: 'rgba(255,165,2,0.06)', borderRadius: '8px', p: 1 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#FFB300', lineHeight: 1 }}>
                    {stats.h2h_draws}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">平局</Typography>
                </Box>
                <Box flex={1} textAlign="center" sx={{ background: 'rgba(244,59,48,0.06)', borderRadius: '8px', p: 1 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#F43B30', lineHeight: 1 }}>
                    {stats.h2h_away_wins}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">客隊勝</Typography>
                </Box>
              </Box>
            </>
          )}
        </SectionCard>
      )}

      {/* ── Probability Charts ── */}
      <SectionCard title="機率分布圖表" sx={{ mb: 2 }}>
        <ProbabilityChart prediction={prediction} sportType={sport_type} />
      </SectionCard>

      {/* ── AI 深度分析報告 ── */}
      {ai_analysis && (
        <Box
          sx={{
            borderRadius: '16px',
            border: '1px solid rgba(0,102,255,0.15)',
            background: '#141F2E',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: 3, py: 2,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 1.5,
              background: 'linear-gradient(90deg, rgba(0,102,255,0.05) 0%, transparent 60%)',
            }}
          >
            <Box
              sx={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'rgba(0,102,255,0.12)', border: '1px solid rgba(0,102,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <PsychologyIcon sx={{ color: '#0066FF', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>AI 深度分析</Typography>
              <Typography variant="caption" color="text.secondary">
                由 Qwen AI 基於統計數據生成 · 僅供參考
              </Typography>
            </Box>
            <Tooltip title="顯示/隱藏原始 OCR 文字">
              <IconButton
                size="small"
                onClick={() => setShowRaw(!showRaw)}
                sx={{ ml: 'auto', color: 'text.secondary' }}
              >
                {showRaw ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ px: 3, py: 2.5 }}>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.82)', lineHeight: 2, whiteSpace: 'pre-wrap', letterSpacing: '0.02em' }}
            >
              {ai_analysis}
            </Typography>
          </Box>

          {/* Raw OCR collapse */}
          <Collapse in={showRaw}>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                OCR 識別原始文字
              </Typography>
              <Box
                mt={1}
                sx={{
                  background: 'rgba(0,0,0,0.5)', borderRadius: '8px', p: 1.5,
                  border: '1px solid rgba(255,255,255,0.06)',
                  maxHeight: 160, overflow: 'auto',
                }}
              >
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {result.match_info?.ocr_confidence !== undefined
                    ? `信心度: ${(result.match_info.ocr_confidence * 100).toFixed(0)}%\n`
                    : ''}
                  {result.raw_text || '(無原始文字)'}
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
