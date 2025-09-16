@echo off
REM =================================================
REM Exam Generator - Enhanced Quick Start 
REM =================================================
REM This script ensures ML models are cached and 
REM starts servers with full functionality
REM =================================================

echo.
echo === Exam Generator - Enhanced Quick Start ===
echo Frontend will be on: http://localhost:3000
echo Backend will be on: http://localhost:5001
echo.

REM Check if virtual environment exists
if not exist "%CD%\backend\venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found at backend\venv
    echo [INFO] Please run setup-and-run.bat first to create the environment
    echo.
    pause
    exit /b 1
)

REM Activate virtual environment and setup models
echo [INFO] Setting up ML models (this may take a few minutes on first run)...
cd /d "%CD%\backend"
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Run model setup script
echo [INFO] Downloading and caching ML models...
python setup_models.py
set MODEL_SETUP_RESULT=%errorlevel%

if %MODEL_SETUP_RESULT% neq 0 (
    echo.
    echo [WARNING] Model setup encountered issues
    echo [INFO] Application will run with reduced functionality
    echo [INFO] Duplicate detection and grammar checking will be disabled
    echo.
    
    REM Set environment variable to disable features
    set DISABLE_ML_FEATURES=true
) else (
    echo.
    echo [SUCCESS] All models setup successfully!
    echo [INFO] Application will run with full functionality
    echo.
    
    REM Enable all features
    set DISABLE_ML_FEATURES=false
)

cd /d "%CD%\.."

REM Start backend with model setup status
echo [INFO] Starting backend server...
start "Backend Server" cmd /k "cd /d "%CD%\backend" && call venv\Scripts\activate.bat && set PORT=5001 && set DISABLE_ML_FEATURES=%DISABLE_ML_FEATURES% && python app.py"

REM Wait for backend to start
echo [INFO] Waiting for backend to initialize...
timeout /t 5 >nul

REM Start frontend
echo [INFO] Starting frontend server...
start "Frontend Server" cmd /k "cd /d "%CD%\frontend" && npm run dev -- --port 3000"

echo.
echo [INFO] Both servers are starting...
echo [INFO] Please wait about 10-15 seconds for both servers to be ready
echo.

REM Wait for servers to fully start
timeout /t 10 >nul

REM Test backend connectivity
echo [INFO] Testing backend connectivity...
curl -s http://localhost:5001/ >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend may not be ready yet. Please check the Backend Server window.
) else (
    echo [SUCCESS] Backend is responding!
)

echo.
echo [INFO] Opening browser...
start "" http://localhost:3000

echo.
echo ========================================
echo   EXAM GENERATOR IS NOW RUNNING!
echo ========================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5001
echo.
if "%DISABLE_ML_FEATURES%"=="true" (
    echo [NOTE] Running with reduced functionality:
    echo - No duplicate question detection
    echo - No grammar error checking
    echo - All other features work normally
    echo.
    echo To enable full features, ensure stable internet
    echo connection and re-run this script.
) else (
    echo [SUCCESS] All features enabled!
    echo - Duplicate question detection: ON
    echo - Grammar error checking: ON  
    echo - Full functionality available
)
echo.
echo Press any key to exit this window
echo (The servers will continue running)
pause >nul