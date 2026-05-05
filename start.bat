@echo off
echo ==================================================
echo Starting ZeroInject Shield Project...
echo ==================================================

echo.
echo [1] Launching FastAPI Backend on port 8000...
start "ZeroInject Backend" cmd /k "cd backend && title ZeroInject Backend && uvicorn main:app --reload --port 8000"

echo.
echo [2] Launching Vite/React Frontend...
start "ZeroInject Frontend" cmd /k "cd frontend && title ZeroInject Frontend && npm run dev"

echo.
echo ==================================================
echo Both services have been launched in separate windows!
echo - Backend API: http://localhost:8000
echo - Frontend UI: http://localhost:5173
echo ==================================================
echo.
echo Keep the newly opened windows running to use the app.
echo You can safely close this script window.

pause
