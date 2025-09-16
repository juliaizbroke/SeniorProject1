@echo off
REM Backend startup script with proper virtual environment activation
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
set PORT=5001
python app.py
pause