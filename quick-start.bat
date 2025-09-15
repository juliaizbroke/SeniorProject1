@echo off
REM =================================================
REM Exam Generator - Quick Start (Skip Dependencies)
REM =================================================
REM This script starts the backend and frontend
REM without reinstalling dependencies.
REM Uses optimized ports: Frontend 3000, Backend 5001
REM =================================================

echo.
echo === Exam Generator - Quick Start ===
echo Frontend will be on: http://localhost:3000
echo Backend will be on: http://localhost:5001
echo.
echo [OPTIMIZATION] Backend will pre-load LanguageTool to avoid slow downloads
echo First upload might still take 10-15 seconds for initial setup
echo Subsequent uploads will be much faster!
echo.

REM Start backend on port 5001
start "Backend Server" cmd /k "cd /d "%CD%\backend" && call venv\Scripts\activate.bat && set PORT=5001 && python app.py"

REM Wait a moment for backend to start
timeout /t 3 >nul

REM Start frontend on port 3000 
start "Frontend Server" cmd /k "cd /d "%CD%\frontend" && npm run dev -- --port 3000"

echo.
echo [INFO] Both servers starting...
echo [INFO] Backend is warming up LanguageTool (this happens once)
echo [INFO] Wait about 15-20 seconds, then go to: http://localhost:3000
echo [INFO] Make sure both command windows show servers running successfully
echo.
echo [SUCCESS] Quick start complete! Servers are running.
echo.
echo Press any key to exit this script (the servers will keep running)...
pause