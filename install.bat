@echo off
chcp 65001 > nul
echo ============================================
echo   SMARTSPORTS AI - 安裝程序
echo ============================================
echo.

REM 設定 Node.js 與 Python 路徑
set PATH=C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python310;%PATH%

REM 尋找可用的 Python
set PYTHON=python
"%LOCALAPPDATA%\Programs\Python\Python312\python.exe" --version > nul 2>&1
if not errorlevel 1 set PYTHON="%LOCALAPPDATA%\Programs\Python\Python312\python.exe"

%PYTHON% --version > nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Python，請先安裝 Python 3.9+
    echo 下載地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 檢查 Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Node.js，請先安裝 Node.js 18+
    echo 下載地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [步驟 1/4] 安裝 Python 後端依賴套件...
echo 注意: EasyOCR 首次安裝需要下載約 1.5GB 的語言模型
echo.
cd /d "%~dp0backend"
%PYTHON% -m pip install -r requirements.txt
if errorlevel 1 (
    echo [錯誤] Python 依賴安裝失敗
    pause
    exit /b 1
)

echo.
echo [步驟 2/4] 訓練 AI 預測模型...
%PYTHON% data\training\sample_data_generator.py
if errorlevel 1 (
    echo [警告] 模型訓練失敗，系統將使用規則推算模式
)

echo.
echo [步驟 3/4] 安裝前端依賴套件...
cd /d "%~dp0frontend"
npm install
if errorlevel 1 (
    echo [錯誤] npm install 失敗
    pause
    exit /b 1
)

echo.
echo [步驟 4/4] 建立必要目錄...
cd /d "%~dp0"
mkdir backend\uploads_temp 2>nul
mkdir backend\models 2>nul

echo.
echo ============================================
echo   安裝完成！
echo   請執行 start.bat 啟動系統
echo ============================================
pause
