@echo off
REM =================================================
REM Exam Generator - Setup & Run
REM =================================================
REM This script installs dependencies and starts
REM the backend and frontend, then opens the app
REM in the default browser (localhost).
REM =================================================

setlocal EnableDelayedExpansion

echo.
echo === Exam Generator - Setup ===
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

REM ----------------------------
REM Check Python
REM ----------------------------
echo [INFO] Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Python not found. Install Python 3.8+.
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)
echo [SUCCESS] Python found: 
%PYTHON_CMD% --version

REM ----------------------------
REM Check Node.js
REM ----------------------------
echo [INFO] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install Node.js 18+.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js found: 
    node --version
)

REM ----------------------------
REM Check npm
REM ----------------------------
echo [INFO] Checking for npm...
call npm --version > temp_npm.txt 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found. Install Node.js which includes npm.
    del temp_npm.txt
    pause
    exit /b 1
) else (
    set /p NPM_VER=<temp_npm.txt
    echo [SUCCESS] npm found: %NPM_VER%
    del temp_npm.txt
)


REM ----------------------------
REM Setup Backend
REM ----------------------------
echo.
echo [INFO] Installing backend dependencies...
cd backend

REM Create virtual environment if missing
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    %PYTHON_CMD% -m venv venv
)

REM Activate venv
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip and install packages
echo [INFO] Upgrading pip and installing Python packages...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo [SUCCESS] Backend ready.

REM ----------------------------
REM Setup Frontend
REM ----------------------------
cd ..\frontend
echo [INFO] Installing frontend dependencies...
call npm install

echo [SUCCESS] Frontend dependencies installed.

echo [INFO] Building frontend...
call npm run build

echo [SUCCESS] Frontend built successfully.

REM ----------------------------
REM Start Backend & Frontend
REM ----------------------------
echo [INFO] Starting backend and frontend...

REM Navigate back to project root
cd ..

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
echo [SUCCESS] Setup complete! Backend and frontend are running.
echo.
echo The application should be available at: http://localhost:3000
echo Backend API is running at: http://localhost:5000
echo.
echo Note: It may take a few moments for the applications to start fully.
echo If localhost:3000 shows connection refused, wait a bit longer and refresh.
echo.
echo Press any key to exit this script (the servers will keep running)...
pause
