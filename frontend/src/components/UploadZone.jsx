import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, LinearProgress,
  ToggleButton, ToggleButtonGroup, Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// 載入階段文字 (與後端流程對應)
const LOADING_STAGES = [
  '正在讀取截圖...',
  'OCR 文字識別中，請稍候...',
  '查詢歷史戰績數據...',
  'AI 模型計算機率...',
  'Qwen AI 深度分析報告生成中...',
  '整理分析結果...',
];

export default function UploadZone({ onResult }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [sportType, setSportType] = useState('auto');
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState('');

  // 模擬分段載入進度
  const simulateProgress = useCallback(async () => {
    for (let i = 0; i < LOADING_STAGES.length; i++) {
      setLoadingStage(i);
      await new Promise(r => setTimeout(r, 600));
    }
  }, []);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('請上傳 PNG 或 JPG 格式的截圖');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('檔案大小不能超過 10MB');
      return;
    }

    // 顯示預覽
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    setError('');
    setLoading(true);
    setLoadingStage(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sport_type', sportType);

    // 啟動進度動畫 (並行)
    const progressPromise = simulateProgress();

    try {
      const { API_BASE } = await import('../services/api');
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '分析失敗，請重試');
      }

      await progressPromise;
      onResult(data);

    } catch (err) {
      setError(err.message || '網路連線失敗，請確認後端服務已啟動 (port 5000)');
    } finally {
      setLoading(false);
    }
  }, [sportType, onResult, simulateProgress]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';  // 允許重複選擇同一檔案
  };

  const progressPercent = loading
    ? Math.round(((loadingStage + 1) / LOADING_STAGES.length) * 100)
    : 0;

  return (
    <Box>
      {/* 運動類型選擇器 */}
      <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>運動類型:</Typography>
        <ToggleButtonGroup
          value={sportType}
          exclusive
          onChange={(_, val) => val && setSportType(val)}
          size="small"
        >
          <ToggleButton value="auto">
            <AutoAwesomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
            自動偵測
          </ToggleButton>
          <ToggleButton value="soccer">
            <SportsSoccerIcon sx={{ mr: 0.5, fontSize: 16 }} />
            足球
          </ToggleButton>
          <ToggleButton value="baseball">
            <SportsBaseballIcon sx={{ mr: 0.5, fontSize: 16 }} />
            棒球
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 拖拽上傳區域 */}
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && document.getElementById('ss-file-input').click()}
        sx={{
          border: `2px dashed`,
          borderColor: dragging ? '#0066FF' : 'rgba(0,102,255,0.2)',
          borderRadius: 3,
          p: 5,
          textAlign: 'center',
          cursor: loading ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          background: dragging
            ? 'rgba(0,102,255,0.06)'
            : preview
              ? 'rgba(0,0,0,0.2)'
              : 'transparent',
          '&:hover': loading ? {} : {
            borderColor: '#0066FF',
            background: 'rgba(0,102,255,0.04)',
            boxShadow: '0 0 20px rgba(0,102,255,0.06)',
          },
        }}
      >
        {preview ? (
          <Box>
            <Box
              component="img"
              src={preview}
              alt="截圖預覽"
              sx={{
                maxHeight: 200,
                maxWidth: '100%',
                borderRadius: 2,
                mb: 2,
                opacity: loading ? 0.5 : 1,
                transition: 'opacity 0.3s',
              }}
            />
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
              <Typography variant="body2" color="text.secondary">
                {fileName}
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2, opacity: 0.8 }} />
            <Typography variant="h6" mb={1}>
              拖拽截圖到此處
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              或點擊選擇檔案
            </Typography>
            <Box display="flex" gap={1} justifyContent="center">
              <Chip label="PNG" size="small" variant="outlined" />
              <Chip label="JPG" size="small" variant="outlined" />
              <Chip label="最大 10MB" size="small" variant="outlined" />
            </Box>
          </>
        )}
      </Box>

      <input
        id="ss-file-input"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        hidden
        onChange={onFileInput}
      />

      {/* 載入進度 */}
      {loading && (
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="primary.light">
              {LOADING_STAGES[loadingStage]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progressPercent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            color="primary"
          />
        </Box>
      )}

      {/* 上傳按鈕 (有截圖時顯示) */}
      {preview && !loading && (
        <Box mt={2} display="flex" gap={2}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => document.getElementById('ss-file-input').click()}
          >
            重新選擇截圖
          </Button>
        </Box>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          mt={2}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: '10px',
            background: 'rgba(244,59,48,0.08)',
            border: '1px solid rgba(244,59,48,0.25)',
          }}
        >
          <Typography variant="body2" sx={{ color: '#F43B30', flex: 1 }}>{error}</Typography>
          <Box component="span" sx={{ cursor: 'pointer', color: 'rgba(244,59,48,0.6)', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setError('')}>×</Box>
        </Box>
      )}
    </Box>
  );
}
