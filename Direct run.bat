@echo off
:: Route to specific sub-modules if called recursively
if "%~1"=="backend" goto run_backend
if "%~1"=="novacart" goto run_novacart
if "%~1"=="dashboard" goto run_dashboard

TITLE ZeroInject Shield - System Launcher
COLOR 0A

echo ========================================================
echo        ZeroInject Shield Demo Launcher
echo ========================================================
echo.

:: Force target relative directory explicitly
cd /d "%~dp0"

IF NOT EXIST backend (
    echo [ERROR] backend folder not found! 
    pause
    exit /b
)
IF NOT EXIST frontend-business (
    echo [ERROR] frontend-business folder not found!
    pause
    exit /b
)
IF NOT EXIST frontend (
    echo [ERROR] frontend folder not found!
    pause
    exit /b
)

echo [OK] All directories verified.
echo.

:: Generate isolated execution scripts to completely bypass Windows spacing bugs!
echo @echo off > temp_backend.bat
echo cd backend >> temp_backend.bat
echo if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat >> temp_backend.bat
echo uvicorn main:app --reload --host 0.0.0.0 --port 8000 >> temp_backend.bat
echo pause >> temp_backend.bat

echo @echo off > temp_novacart.bat
echo cd frontend-business >> temp_novacart.bat
echo if not exist node_modules\ call npm install >> temp_novacart.bat
echo npm run dev -- --port 5173 >> temp_novacart.bat
echo pause >> temp_novacart.bat

echo @echo off > temp_dashboard.bat
echo cd frontend >> temp_dashboard.bat
echo if not exist node_modules\ call npm install >> temp_dashboard.bat
echo npm run dev -- --port 5174 >> temp_dashboard.bat
echo pause >> temp_dashboard.bat

:: 2. Backend startup
echo [1/3] Starting Backend API (FastAPI)...
start "Backend Server" cmd /k temp_backend.bat
timeout /t 4 /nobreak >nul

:: 3. Frontend Business startup (NovaCart)
echo [2/3] Starting NovaCart Website (Frontend Business)...
start "NovaCart Frontend" cmd /k temp_novacart.bat
timeout /t 4 /nobreak >nul

:: 4. Dashboard startup
echo [3/3] Starting ZeroInject Dashboard...
start "Dashboard Frontend" cmd /k temp_dashboard.bat
timeout /t 5 /nobreak >nul

:: 5. Auto open browser
echo.
echo ========================================================
echo   All systems started successfully!
echo   Opening browsers...
echo ========================================================
echo.

start http://localhost:5173
start http://localhost:5174
start http://localhost:8000/docs

echo ZeroInject Shield is now running.
echo You may safely close this launcher window (the separate terminals will stay open).
pause
exit /b
