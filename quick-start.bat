@echo off
REM =================================================
REM Exam Generator - Quick Start (Skip Dependencies)
REM =================================================
REM This script starts the backend and frontend
REM without reinstalling dependencies
REM =================================================

setlocal EnableDelayedExpansion

echo.
echo === Exam Generator - Quick Start ===
echo.

REM Check if we're in the project root
if not exist "frontend" (
    echo [ERROR] Cannot find 'frontend' folder. Run this script from project root.
    pause
    exit /b 1
)
if not exist "backend" (
    echo [ERROR] Cannot find 'backend' folder. Run this script from project root.
    pause
    exit /b 1
)

REM Check for Python command
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Python not found.
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

echo [INFO] Starting backend and frontend servers...

REM Start backend in a new command window
start "Backend Server" cmd /k "cd /d "%CD%\backend" && call venv\Scripts\activate.bat && set PORT=5000 && %PYTHON_CMD% app.py"

REM Start frontend in a new command window  
start "Frontend Server" cmd /k "cd /d "%CD%\frontend" && npm run start"

REM Wait for services to start up
echo [INFO] Waiting for services to start (15 seconds)...
timeout /t 15 >nul

REM Try to verify services are running
echo [INFO] Checking if services are running...
curl -s http://localhost:5000/ >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend is responding on port 5000
) else (
    echo [WARNING] Backend might not be fully started yet
)

curl -s http://localhost:3000/ >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Frontend is responding on port 3000
) else (
    echo [WARNING] Frontend might not be fully started yet
)

REM Open browser regardless of curl check (curl might not be available)
echo [INFO] Opening browser...
start http://localhost:3000

echo.
echo [SUCCESS] Services started!
echo.
echo The application should be available at: http://localhost:3000
echo Backend API is running at: http://localhost:5000
echo.
echo If localhost:3000 shows connection refused, wait a bit longer and refresh.
echo.
echo Press any key to exit this script (the servers will keep running)...
pause