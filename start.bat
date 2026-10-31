@echo off
chcp 65001 > nul

title WinRead - Desktop E-Book Reader

echo ============================================================
echo             Starting WinRead Desktop Application
echo ============================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js LTS or add it to PATH.
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules\electron" (
    echo [*] First run detected. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

:: Start Electron
echo [*] Launching WinRead...
call npm start

if %errorlevel% neq 0 (
    echo.
    echo [NOTE] WinRead exited with code %errorlevel%
    pause
)
