import React, { useState, useCallback } from 'react';
import { Button, Dialog, Box, Typography, IconButton } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';

/* ─── Canvas helpers ─── */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncate(text, maxLen) {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
}

function drawTemplate(canvas, data) {
  const ctx = canvas.getContext('2d');
  const W = 1080;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;

  const { homeTeam, awayTeam, recommendation, confidence, homeWin, draw, awayWin, league, sport, ouRec } = data;

  /* ── Background ── */
  ctx.fillStyle = '#0A1628';
  ctx.fillRect(0, 0, W, H);

  // Blue radial glow (top-center)
  const g1 = ctx.createRadialGradient(W / 2, 200, 0, W / 2, 200, 700);
  g1.addColorStop(0, 'rgba(0,102,255,0.16)');
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // Cyan glow (bottom-right)
  const g2 = ctx.createRadialGradient(W * 0.85, H * 0.85, 0, W * 0.85, H * 0.85, 500);
  g2.addColorStop(0, 'rgba(0,212,255,0.09)');
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // Dot grid
  ctx.fillStyle = 'rgba(0,102,255,0.11)';
  const sp = 36;
  for (let x = sp; x < W; x += sp) {
    for (let y = sp; y < H; y += sp) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ── Top accent bar ── */
  const topGrd = ctx.createLinearGradient(0, 0, W, 0);
  topGrd.addColorStop(0, '#00C853');
  topGrd.addColorStop(0.45, '#0066FF');
  topGrd.addColorStop(1, '#00D4FF');
  ctx.fillStyle = topGrd;
  ctx.fillRect(0, 0, W, 5);

  /* ── Header: Logo + branding ── */
  const lx = 60, ly = 52;

  // Logo box
  const logoGrd = ctx.createLinearGradient(lx, ly, lx + 62, ly + 62);
  logoGrd.addColorStop(0, '#041830');
  logoGrd.addColorStop(1, '#0066FF');
  ctx.fillStyle = logoGrd;
  roundRect(ctx, lx, ly, 62, 62, 14);
  ctx.fill();
  // Glow on logo
  ctx.shadowColor = 'rgba(0,102,255,0.6)';
  ctx.shadowBlur = 20;
  roundRect(ctx, lx, ly, 62, 62, 14);
  ctx.fill();
  ctx.shadowBlur = 0;

  // "W" in logo
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 38px "Inter", "Noto Sans TC", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('W', lx + 31, ly + 31);

  // Brand name gradient
  const nameGrd = ctx.createLinearGradient(lx + 80, 0, lx + 280, 0);
  nameGrd.addColorStop(0, '#4D9FFF');
  nameGrd.addColorStop(0.5, '#00D4FF');
  nameGrd.addColorStop(1, '#00C853');
  ctx.fillStyle = nameGrd;
  ctx.font = 'bold 38px "Inter", Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('WINGAME', lx + 80, ly + 6);

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '19px "Inter", Arial';
  ctx.fillText('AI SPORTS ANALYTICS', lx + 80, ly + 46);

  // Date top-right
  const now = new Date();
  const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.font = '22px "Inter", Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(dateStr, W - 60, ly + 6);

  // AI badge (top-right)
  ctx.fillStyle = 'rgba(0,200,83,0.12)';
  roundRect(ctx, W - 190, ly + 38, 130, 32, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,200,83,0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, W - 190, ly + 38, 130, 32, 16);
  ctx.stroke();
  ctx.fillStyle = '#00C853';
  ctx.beginPath();
  ctx.arc(W - 181, ly + 54, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 18px "Inter", Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('AI 分析中', W - 172, ly + 54);

  /* ── League badge ── */
  const leagueText = truncate(league, 16) || (sport === 'baseball' ? 'MLB 美國職棒' : '足球賽事');
  ctx.font = 'bold 22px "Inter", "Noto Sans TC", Arial';
  ctx.textAlign = 'center';
  const lw = Math.min(ctx.measureText(leagueText).width + 48, W - 120);
  ctx.fillStyle = 'rgba(0,102,255,0.1)';
  roundRect(ctx, W / 2 - lw / 2, 148, lw, 42, 21);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,102,255,0.28)';
  ctx.lineWidth = 1;
  roundRect(ctx, W / 2 - lw / 2, 148, lw, 42, 21);
  ctx.stroke();
  ctx.fillStyle = '#4D9FFF';
  ctx.textBaseline = 'middle';
  ctx.fillText(leagueText, W / 2, 169);

  /* ── Separator ── */
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 215);
  ctx.lineTo(W - 60, 215);
  ctx.stroke();

  /* ── Teams ── */
  const teamY = 238;

  // Home box
  ctx.fillStyle = 'rgba(0,102,255,0.08)';
  roundRect(ctx, 60, teamY, 390, 130, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,102,255,0.22)';
  ctx.lineWidth = 1;
  roundRect(ctx, 60, teamY, 390, 130, 16);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 46px "Inter", "Noto Sans TC", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(truncate(homeTeam, 7), 255, teamY + 58);
  ctx.fillStyle = 'rgba(77,159,255,0.85)';
  ctx.font = 'bold 20px "Inter", Arial';
  ctx.fillText('主隊', 255, teamY + 104);

  // VS circle
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.arc(W / 2, teamY + 65, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = 'bold 28px "Inter", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', W / 2, teamY + 65);

  // Away box
  ctx.fillStyle = 'rgba(244,59,48,0.06)';
  roundRect(ctx, W - 450, teamY, 390, 130, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(244,59,48,0.18)';
  ctx.lineWidth = 1;
  roundRect(ctx, W - 450, teamY, 390, 130, 16);
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 46px "Inter", "Noto Sans TC", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(truncate(awayTeam, 7), W - 255, teamY + 58);
  ctx.fillStyle = 'rgba(244,59,48,0.85)';
  ctx.font = 'bold 20px "Inter", Arial';
  ctx.fillText('客隊', W - 255, teamY + 104);

  /* ── Recommendation box ── */
  const recY = 400;

  const recBg = ctx.createLinearGradient(60, recY, W - 60, recY + 190);
  recBg.addColorStop(0, 'rgba(0,102,255,0.12)');
  recBg.addColorStop(0.6, 'rgba(0,212,255,0.05)');
  recBg.addColorStop(1, 'rgba(0,200,83,0.07)');
  ctx.fillStyle = recBg;
  roundRect(ctx, 60, recY, W - 120, 190, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,102,255,0.28)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 60, recY, W - 120, 190, 20);
  ctx.stroke();

  // Accent top strip
  const stripGrd = ctx.createLinearGradient(60, recY, W - 60, recY);
  stripGrd.addColorStop(0, '#00C853');
  stripGrd.addColorStop(0.5, '#0066FF');
  stripGrd.addColorStop(1, '#00D4FF');
  ctx.fillStyle = stripGrd;
  roundRect(ctx, 60, recY, W - 120, 4, 2);
  ctx.fill();

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.font = '22px "Inter", Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('AI 推薦投注', 100, recY + 26);

  // Recommendation text
  ctx.fillStyle = '#0066FF';
  ctx.shadowColor = 'rgba(0,102,255,0.5)';
  ctx.shadowBlur = 24;
  ctx.font = 'bold 80px "Inter", "Noto Sans TC", Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(recommendation || '主隊勝', 100, recY + 60);
  ctx.shadowBlur = 0;

  // Confidence label
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.font = '22px "Inter", Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('信心指數', W - 100, recY + 26);

  // Confidence value gradient
  const cfGrd = ctx.createLinearGradient(W - 220, recY + 55, W - 100, recY + 165);
  cfGrd.addColorStop(0, '#00D4FF');
  cfGrd.addColorStop(1, '#00C853');
  ctx.fillStyle = cfGrd;
  ctx.shadowColor = 'rgba(0,212,255,0.4)';
  ctx.shadowBlur = 20;
  ctx.font = 'bold 100px "Inter", Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`${confidence}%`, W - 100, recY + 52);
  ctx.shadowBlur = 0;

  /* ── Probability bars ── */
  const barSectionY = 628;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = 'bold 22px "Inter", Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('勝率機率分布', 60, barSectionY);

  const bars = sport === 'baseball'
    ? [
        { label: '主隊勝', value: homeWin || 0, color: '#0066FF' },
        { label: '客隊勝', value: awayWin || 0, color: '#F43B30' },
      ]
    : [
        { label: '主隊勝', value: homeWin || 0, color: '#0066FF' },
        { label: '平局',   value: draw || 0,    color: '#FFB300' },
        { label: '客隊勝', value: awayWin || 0, color: '#F43B30' },
      ];

  const bh = 24;
  const bgap = 58;
  const bStart = barSectionY + 40;
  const bWidth = W - 120;

  bars.forEach(({ label, value, color }, i) => {
    const by = bStart + i * bgap;

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '22px "Inter", "Noto Sans TC", Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 60, by + bh / 2);

    ctx.fillStyle = color;
    ctx.font = 'bold 26px "Inter", Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${value}%`, W - 60, by + bh / 2);

    // Track bg
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, 60, by + bh + 8, bWidth, bh, bh / 2);
    ctx.fill();

    // Track fill
    const fillW = (value / 100) * bWidth;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.78;
    roundRect(ctx, 60, by + bh + 8, Math.max(fillW, bh / 2), bh, bh / 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  /* ── Over/Under ── */
  if (ouRec) {
    const ouY = bStart + bars.length * bgap + 16;
    ctx.fillStyle = 'rgba(0,200,83,0.1)';
    roundRect(ctx, 60, ouY, W - 120, 54, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,200,83,0.28)';
    ctx.lineWidth = 1;
    roundRect(ctx, 60, ouY, W - 120, 54, 12);
    ctx.stroke();
    ctx.fillStyle = '#00C853';
    ctx.font = 'bold 26px "Inter", "Noto Sans TC", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`大小球推薦：${ouRec}`, W / 2, ouY + 27);
  }

  /* ── Bottom separator ── */
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, H - 98);
  ctx.lineTo(W - 60, H - 98);
  ctx.stroke();

  /* ── Footer disclaimer ── */
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = '20px "Inter", "Noto Sans TC", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('本分析僅供參考，不構成任何投注建議。請理性娛樂，量力而為。', W / 2, H - 66);

  /* ── Footer brand ── */
  const footGrd = ctx.createLinearGradient(W / 2 - 120, 0, W / 2 + 120, 0);
  footGrd.addColorStop(0, '#4D9FFF');
  footGrd.addColorStop(0.5, '#00D4FF');
  footGrd.addColorStop(1, '#00C853');
  ctx.fillStyle = footGrd;
  ctx.font = 'bold 30px "Inter", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WINGAME AI', W / 2, H - 34);
}

/* ─── Component ─── */
export default function IGExportButton({ result }) {
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);

  const handleExport = useCallback(() => {
    const { match_info, prediction, sport_type } = result;
    const { winner, over_under } = prediction;

    const rawConf = Math.max(winner.home_win || 0, winner.draw || 0, winner.away_win || 0);
    const displayConf = Math.min(rawConf + 15, 80);

    const canvas = document.createElement('canvas');
    drawTemplate(canvas, {
      homeTeam: match_info.home_team || '主隊',
      awayTeam: match_info.away_team || '客隊',
      recommendation: prediction.recommended || '主隊勝',
      confidence: displayConf,
      homeWin: winner.home_win || 0,
      draw: winner.draw || 0,
      awayWin: winner.away_win || 0,
      league: match_info.league || '',
      sport: sport_type,
      ouRec: over_under?.recommendation || null,
    });

    setImgUrl(canvas.toDataURL('image/png'));
    setOpen(true);
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!imgUrl) return;
    const link = document.createElement('a');
    const home = (result.match_info.home_team || 'home').replace(/\s/g, '-');
    const away = (result.match_info.away_team || 'away').replace(/\s/g, '-');
    link.download = `wingame-${home}-vs-${away}.png`;
    link.href = imgUrl;
    link.click();
  }, [imgUrl, result]);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={handleExport}
        startIcon={<InstagramIcon sx={{ fontSize: 16 }} />}
        sx={{
          borderColor: 'rgba(225,48,108,0.35)',
          color: '#E1306C',
          background: 'rgba(225,48,108,0.05)',
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '0.8rem',
          px: 1.8,
          py: 0.7,
          '&:hover': {
            borderColor: '#E1306C',
            background: 'rgba(225,48,108,0.1)',
          },
          transition: 'all 0.2s',
        }}
      >
        一鍵輸出 IG 模板
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: '#0D1B2E',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px',
          },
        }}
      >
        <Box sx={{ p: 2.5 }}>
          {/* Modal header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{
                width: 28, height: 28, borderRadius: '8px',
                background: 'linear-gradient(135deg, #833AB4, #E1306C, #FD1D1D)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <InstagramIcon sx={{ fontSize: 17, color: '#fff' }} />
              </Box>
              <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>Instagram 模板預覽</Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Preview image */}
          {imgUrl && (
            <Box sx={{
              borderRadius: '12px', overflow: 'hidden', mb: 2,
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <img src={imgUrl} alt="IG 模板預覽" style={{ width: '100%', display: 'block' }} />
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mb={1.5}>
            1080 × 1080 px · 適用 Instagram 貼文格式
          </Typography>

          {/* Download button */}
          <Button
            variant="contained"
            fullWidth
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{
              background: 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #FD1D1D 100%)',
              fontWeight: 700,
              py: 1.3,
              borderRadius: '10px',
              fontSize: '0.92rem',
              '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-1px)' },
              transition: 'all 0.2s',
            }}
          >
            下載 PNG
          </Button>
        </Box>
      </Dialog>
    </>
  );
}
