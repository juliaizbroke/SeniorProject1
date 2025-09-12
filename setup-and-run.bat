@echo off
REM Exam Generator - Easy Setup Script for Windows
REM This script will install all dependencies and start the application

setlocal EnableDelayedExpansion

echo.
echo 🎓 Exam Generator - Easy Setup
echo ================================
echo.

REM Check if we're in the right directory
if not exist "frontend" (
    echo [ERROR] Please run this script from the project root directory
    echo [ERROR] Make sure you can see 'frontend' and 'backend' folders
    pause
    exit /b 1
)

if not exist "backend" (
    echo [ERROR] Please run this script from the project root directory
    echo [ERROR] Make sure you can see 'frontend' and 'backend' folders
    pause
    exit /b 1
)

REM Check for Python
echo [INFO] Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Python is not installed!
        echo Please install Python 3.8 or higher from https://python.org
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
        echo [SUCCESS] Found Python: 
        py --version
    )
) else (
    set PYTHON_CMD=python
    echo [SUCCESS] Found Python: 
    python --version
)

REM Check for Node.js
echo [INFO] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js 18 or higher from https://nodejs.org
    pause
    exit /b 1
) else (
    echo [SUCCESS] Found Node.js: 
    node --version
)

REM Check for npm
echo [INFO] Checking for npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    echo Please install Node.js which includes npm from https://nodejs.org
    pause
    exit /b 1
) else (
    echo [SUCCESS] Found npm: 
    npm --version
)

echo.
echo [INFO] Starting installation process...
echo.

REM Install Python dependencies
echo [INFO] Installing Python dependencies...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    %PYTHON_CMD% -m venv venv
)

REM Activate virtual environment
echo [INFO] Activating Python virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo [INFO] Installing Python packages...
pip install -r requirements.txt

echo [SUCCESS] Python dependencies installed successfully!

REM Go back to root and install Node.js dependencies
cd ..\frontend
echo [INFO] Installing Node.js dependencies...
call npm install

echo [SUCCESS] Node.js dependencies installed successfully!

echo.
echo [INFO] Building the application for Electron...

REM Set environment variable for Electron build
set ELECTRON=true

REM Build the frontend
call npm run build

echo [SUCCESS] Application built successfully!

echo.
echo [INFO] Starting the Exam Generator...
echo.

REM Start the application
call npm run electron

echo.
echo [SUCCESS] Setup completed successfully!
echo Next time, you can run the application directly with:
echo   cd frontend ^&^& npm run electron
echo.
pause
