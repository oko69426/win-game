import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import { Box, Grid, Typography } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const CHART_COLORS = {
  home: { bg: 'rgba(0, 102, 255, 0.75)', border: '#0066FF' },
  draw: { bg: 'rgba(255, 165, 2, 0.75)', border: '#FFB300' },
  away: { bg: 'rgba(244, 59, 48, 0.75)', border: '#F43B30' },
  over: { bg: 'rgba(0, 102, 255, 0.7)', border: '#0066FF' },
  under: { bg: 'rgba(0, 200, 83, 0.7)', border: '#00C853' },
};

const CHART_OPTS = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: 'rgba(255,255,255,0.75)',
        font: { size: 13, family: '"Inter", "Noto Sans TC", sans-serif' },
        padding: 16,
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.parsed}%`,
      },
      backgroundColor: 'rgba(10,10,10,0.95)',
      titleColor: '#0066FF',
      bodyColor: 'rgba(255,255,255,0.8)',
      borderColor: 'rgba(0,102,255,0.2)',
      borderWidth: 1,
    },
  },
};

export default function ProbabilityChart({ prediction, sportType }) {
  const { winner, over_under } = prediction;

  // 勝負甜甜圈圖數據
  const winnerLabels = sportType === 'soccer'
    ? ['主隊勝', '平局', '客隊勝']
    : ['主隊勝', '客隊勝'];

  const winnerData = sportType === 'soccer'
    ? [winner.home_win, winner.draw, winner.away_win]
    : [winner.home_win, winner.away_win];

  const winnerColors = sportType === 'soccer'
    ? [CHART_COLORS.home, CHART_COLORS.draw, CHART_COLORS.away]
    : [CHART_COLORS.home, CHART_COLORS.away];

  const doughnutData = {
    labels: winnerLabels,
    datasets: [{
      data: winnerData,
      backgroundColor: winnerColors.map(c => c.bg),
      borderColor: winnerColors.map(c => c.border),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  // 大小球柱狀圖
  const overUnderData = {
    labels: [`大 (Over ${over_under?.line || ''})`, `小 (Under ${over_under?.line || ''})`],
    datasets: [{
      label: '機率 %',
      data: [over_under?.over ?? 50, over_under?.under ?? 50],
      backgroundColor: [CHART_COLORS.over.bg, CHART_COLORS.under.bg],
      borderColor: [CHART_COLORS.over.border, CHART_COLORS.under.border],
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const barOpts = {
    ...CHART_OPTS,
    plugins: {
      ...CHART_OPTS.plugins,
      legend: { display: false },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: 'rgba(255,255,255,0.5)',
          callback: (v) => `${v}%`,
        },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 12 } },
        grid: { display: false },
      },
    },
  };

  return (
    <Grid container spacing={4}>
      {/* 勝負機率甜甜圈 */}
      <Grid item xs={12} md={6}>
        <Typography variant="h6" textAlign="center" mb={2} color="primary">
          勝負機率分布
        </Typography>
        <Box sx={{ maxWidth: 280, mx: 'auto' }}>
          <Doughnut
            data={doughnutData}
            options={{
              ...CHART_OPTS,
              cutout: '65%',
              plugins: {
                ...CHART_OPTS.plugins,
                tooltip: {
                  ...CHART_OPTS.plugins.tooltip,
                  callbacks: { label: (ctx) => ` ${ctx.parsed}%` },
                },
              },
            }}
          />
        </Box>
      </Grid>

      {/* 大小球柱狀圖 */}
      <Grid item xs={12} md={6}>
        <Typography variant="h6" textAlign="center" mb={2} color="primary">
          大小球預測
        </Typography>
        <Box sx={{ maxWidth: 300, mx: 'auto' }}>
          <Bar data={overUnderData} options={barOpts} />
        </Box>
        {over_under?.recommendation && (
          <Typography variant="body2" textAlign="center" mt={1} color="text.secondary">
            推薦: <strong style={{ color: '#0066FF' }}>{over_under.recommendation}</strong>
          </Typography>
        )}
      </Grid>
    </Grid>
  );
}
