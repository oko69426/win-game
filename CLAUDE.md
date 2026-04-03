# WINGAME AI — 開發指引

## 啟動方式
後端和 ngrok 都需要開著，缺一不可：

**PowerShell 1 — 後端（port 8080）：**
```powershell
C:\Users\Adam\AppData\Local\Programs\Python\Python312\python.exe C:\Users\Adam\Desktop\openclaw\backend\app.py
```

**PowerShell 2 — ngrok：**
```powershell
C:\Users\Adam\Desktop\openclaw\ngrok.exe http --url=earle-nonfrequent-hyo.ngrok-free.dev 8080
```

**前端（Vercel 已部署）：** https://win-game-ochre.vercel.app
**後端 ngrok URL：** https://earle-nonfrequent-hyo.ngrok-free.dev

---

## 技術架構

- **Backend**: Flask, Python 3.12, port 8080, SQLite
- **Frontend**: React 18 + MUI v5, 部署在 Vercel
- **APIs**: Football-Data.org, DashScope Qwen
- **ML**: XGBoost（足球）+ rule-based fallback
- **OCR**: EasyOCR `['ch_tra', 'en']` lazy-load

**Key Paths:**
- Backend: `c:\Users\Adam\Desktop\openclaw\backend\`
- Frontend: `c:\Users\Adam\Desktop\openclaw\frontend\src\`

---

## 產品路線圖（世界盃2026）

### 核心定位
**情緒價值 > 預測準確度**
賣的是「AI 在幫我看比賽」的感覺，不是保證勝率。
法律定位：娛樂分析工具（同 Bloomberg/TradingView）。

### Phase 1 — YouTube 分析 Demo
- 貼入 YouTube URL → 自動截幀
- supervision + YOLOv8 球員追蹤 overlay
- 輸出帶 AI 標注的分析影片 + 數據面板
- Demo 影片：Real Madrid vs Barcelona 2-5 Supercopa 2025
  `https://youtu.be/YsWzugAnsBw`

### Phase 2 — 即時賽況儀表板
- YouTube embed（左）+ AI 分析面板（右）
- 每5秒截幀 → supervision 分析 → 更新數據
- 動態：勝率曲線、壓迫熱力圖、危險指數
- 分享卡片（截圖發社群）

### Phase 3 — 世界盃版（6月11日前上線）
- 繁/簡/英/泰/葡文 全語言
- 48 隊專屬頁面
- 積分系統
- 世界盃特別版 UI

---

## 商業模式

| 層次 | 對象 | 定價 |
|---|---|---|
| B2C 訂閱 | 個人投注者 | $10-50/月 |
| B2B 白牌 | 投注平台嵌入 | $3k-20k/月 |
| API 授權 | 數據/媒體公司 | 按用量 |

**地理擴張：**
1. 台灣/香港（現有）→ 東南亞（泰、越、馬）→ 英國
2. 世界盃期間：巴西/墨西哥、印度、中東

---

## 競品差異化

競品（截圖中的中文 app）：文字型多智能體（Alpha/Beta/Gamma 爬數據）
WINGAME：**視覺型 AI**（電腦視覺真的在「看」比賽）

---

## 現有功能

- OCR 截圖分析（上傳比賽截圖 → 預測）
- 讓分盤 / 大小球預測
- 每日精選推薦（Football-Data API）
- Qwen AI 深度分析文字
- 分析歷史記錄
- 6個前端頁面：`/`, `/analysis`, `/history`, `/daily-picks`, `/performance`, `/methodology`

## 已知 Bug / 注意事項
- Python 不在 bash PATH，只能用 PowerShell 啟動
- OCR 中文隊名不能用 `\b`，已用5層 fallback 修復
