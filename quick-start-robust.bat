@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Exam Generator - Comprehensive Setup
echo ========================================

cd /d "%~dp0"

REM Check if we're in the right directory
if not exist "backend\app.py" (
    echo ERROR: Cannot find backend\app.py - wrong directory?
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: Cannot find frontend\package.json - wrong directory?
    pause
    exit /b 1
)

echo [1/6] Setting up Python virtual environment...
cd backend
if not exist "venv\" (
    echo Creating new virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

echo [2/6] Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

pip install -q --upgrade pip
pip install -q -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo [3/6] Pre-downloading and caching ML models in virtual environment...
echo This prevents runtime hangs during first upload...
python setup_models_venv.py
set MODEL_SETUP_RESULT=!errorlevel!

if !MODEL_SETUP_RESULT! neq 0 (
    echo WARNING: Some models failed to setup - will run with limited features
    set DISABLE_ML_FEATURES=true
) else (
    echo SUCCESS: All ML models cached successfully
    set DISABLE_ML_FEATURES=false
)

echo [4/6] Setting up frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo [5/6] Building frontend...
call npm run build
if errorlevel 1 (
    echo WARNING: Frontend build failed - using development mode
)

echo [6/6] Starting services with model pre-caching...
echo.
echo ========================================
echo  Services Starting
echo ========================================
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3000
echo ML Features: !DISABLE_ML_FEATURES! ^(disabled^) / true ^(enabled^)
echo ========================================

REM Start backend with environment variable
cd ..\backend
start "Backend Server" cmd /k "set DISABLE_ML_FEATURES=!DISABLE_ML_FEATURES! && call venv\Scripts\activate.bat && python app.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak > nul

REM Open browser
echo Opening browser to http://localhost:3000...
start http://localhost:3000

echo.
echo ========================================
echo  Startup Complete!
echo ========================================
echo - Backend server running on port 5001
echo - Frontend server running on port 3000
echo - Browser should open automatically
echo - Close this window to continue using the app
echo - Use Ctrl+C in server windows to stop services
echo ========================================

pause