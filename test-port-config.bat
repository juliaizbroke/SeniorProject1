@echo off
REM =================================================
REM Test All Startup Scripts - Port Verification
REM =================================================

echo.
echo === Testing Startup Scripts Port Configuration ===
echo.

echo [TEST 1] Checking quick-start.bat...
findstr /n "PORT=5001" quick-start.bat >nul && (
    echo [✓] quick-start.bat uses correct backend port 5001
) || (
    echo [✗] quick-start.bat has wrong backend port
)

findstr /n "port 3000" quick-start.bat >nul && (
    echo [✓] quick-start.bat uses correct frontend port 3000
) || (
    echo [✗] quick-start.bat has wrong frontend port
)

echo.
echo [TEST 2] Checking setup-and-run.bat...
findstr /n "PORT=5001" setup-and-run.bat >nul && (
    echo [✓] setup-and-run.bat uses correct backend port 5001
) || (
    echo [✗] setup-and-run.bat has wrong backend port
)

findstr /n "port 3000" setup-and-run.bat >nul && (
    echo [✓] setup-and-run.bat uses correct frontend port 3000
) || (
    echo [✗] setup-and-run.bat has wrong frontend port
)

echo.
echo [TEST 3] Checking frontend .env.local...
findstr /n "localhost:5001" frontend\.env.local >nul && (
    echo [✓] .env.local uses correct backend URL localhost:5001
) || (
    echo [✗] .env.local has wrong backend URL
)

echo.
echo === Port Configuration Test Complete ===
echo.
echo All scripts should now use:
echo - Frontend: localhost:3000
echo - Backend: localhost:5001
echo.
echo Choose your startup method:
echo [1] quick-start.bat      - Quick start (recommended for testing)
echo [2] setup-and-run.bat    - Full setup with dependencies
echo.
pause