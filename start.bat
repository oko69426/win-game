@echo off
chcp 65001 > nul
echo ============================================
echo   SMARTSPORTS AI - 啟動系統
echo ============================================
echo.

REM 設定 Node.js 與 Python 路徑
set PATH=C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python310;%PATH%

REM 尋找可用的 Python
set PYTHON=python
"%LOCALAPPDATA%\Programs\Python\Python312\python.exe" --version > nul 2>&1
if not errorlevel 1 set PYTHON=%LOCALAPPDATA%\Programs\Python\Python312\python.exe

REM 啟動 Python 後端 (Flask)
echo [1/2] 啟動後端 API 服務 (port 5000)...
start "SmartSports-Backend" cmd /c "cd /d "%~dp0backend" && "%PYTHON%" app.py"

REM 等待後端啟動
timeout /t 3 /nobreak > nul

REM 啟動 React 前端
echo [2/2] 啟動前端服務 (port 3000)...
start "SmartSports-Frontend" cmd /c "cd /d "%~dp0frontend" && npm start 2>&1"

echo.
echo ============================================
echo   系統啟動中，請稍候...
echo.
echo   後端 API: http://localhost:5000/api/health
echo   前端介面: http://localhost:3000
echo.
echo   關閉視窗時請同時關閉
echo   "SmartSports-Backend" 和 "SmartSports-Frontend" 視窗
echo ============================================
echo.

REM 等待前端啟動後自動開啟瀏覽器
timeout /t 10 /nobreak > nul
start "" "http://localhost:3000"

pause
