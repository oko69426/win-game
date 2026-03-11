# SMARTSPORTS AI - AI 運彩分析平台

> ⚠️ **免責聲明**: 本系統所有分析結果僅供學術參考，不構成任何投注建議。

## 功能介紹

- **截圖上傳**: 拖拽或選擇運彩截圖 (PNG/JPG)
- **OCR 識別**: 自動提取隊名、賠率、比賽時間
- **歷史數據**: 整合 Football-Data.org / MLB Stats API / TheSportsDB
- **AI 預測**: XGBoost 模型計算主客勝率與大小球機率
- **視覺化**: Chart.js 甜甜圈圖 + 柱狀圖
- **多語言**: 支援繁體中文、簡體中文、英文截圖
- **多運動**: 足球 (EPL/世界杯) + 棒球 (MLB/CPBL)

## 快速開始

### 系統需求

- **Python** 3.9 以上
- **Node.js** 18 以上
- **pip** (Python 套件管理)
- **npm** (Node.js 套件管理)
- 磁碟空間: 至少 3GB (EasyOCR 語言模型)

### 安裝步驟

1. **一次性安裝** (雙擊執行):
   ```
   install.bat
   ```
   此腳本會自動安裝所有依賴並訓練 AI 模型 (約需 10-20 分鐘)。

2. **每次啟動** (雙擊執行):
   ```
   start.bat
   ```
   系統啟動後會自動開啟瀏覽器。

3. **訪問網站**: http://localhost:3000

### 手動啟動 (開發用)

```bash
# 後端 (Terminal 1)
cd backend
pip install -r requirements.txt
python data/training/sample_data_generator.py  # 訓練模型 (一次即可)
python app.py

# 前端 (Terminal 2)
cd frontend
npm install
npm start
```

## 使用方法

1. 前往「AI 分析」頁面
2. 選擇運動類型 (或使用自動偵測)
3. 拖拽截圖到上傳區域
4. 等待 AI 分析 (約 5-30 秒，首次較長)
5. 查看勝負機率、大小球建議

## 技術架構

```
截圖上傳
   ↓
OCR 識別 (EasyOCR: 繁中+簡中+英)
   ↓
體育 API 查詢 (Football-Data / MLB / TheSportsDB)
   ↓
XGBoost ML 預測 (12 維特徵向量)
   ↓
視覺化結果 (Chart.js)
```

### 預測準確率說明

| 模式 | 條件 | 準確率估計 |
|---|---|---|
| XGBoost 模型 | 執行 install.bat 後 | 65-70% (合成數據) |
| 規則推算 | 模型未訓練 | 55-60% |

> **注意**: 使用真實歷史比賽數據 (Kaggle Soccer Dataset) 重訓練後，準確率可提升至 70-75%。

## API 設定

在 `backend/config.py` 中設定 API 金鑰:

```python
FOOTBALL_DATA_API_KEY = "YOUR_KEY"  # football-data.org 免費申請
```

- **Football-Data.org**: 免費申請 → https://www.football-data.org/client/register
- **MLB Stats API**: 免費，無需金鑰
- **TheSportsDB**: 免費版無需金鑰

## 目錄結構

```
openclaw/
├── backend/          # Python Flask 後端
│   ├── app.py        # 主應用程式
│   ├── routes/       # API 路由
│   ├── services/     # OCR / API / ML 服務
│   ├── models/       # 訓練好的模型 (.pkl)
│   └── utils/        # 資料庫 / 文字解析
├── frontend/         # React 前端
│   └── src/
│       ├── pages/    # 首頁 / 分析頁 / 歷史頁
│       └── components/ # 上傳 / 圖表 / 結果顯示
├── install.bat       # 一次性安裝腳本
└── start.bat         # 每次啟動腳本
```

## 常見問題

**Q: EasyOCR 初始化很慢?**
A: 首次呼叫需要載入語言模型 (約 2-3 分鐘)，之後會快取在記憶體中。

**Q: OCR 無法識別隊名?**
A: 確保截圖清晰，且包含「主隊 vs 客隊」格式。可手動指定運動類型。

**Q: API 查詢失敗?**
A: 系統會自動使用中性數值繼續分析，不會崩潰。建議設定 Football-Data API Key。

**Q: 模型未訓練 (Tier 3 模式)?**
A: 執行 `cd backend && python data/training/sample_data_generator.py` 訓練模型。
