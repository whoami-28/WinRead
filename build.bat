@echo off
chcp 65001 > nul

title WinRead - Production Build & Installer

echo ============================================================
echo           WinRead Production Build & Packaging
echo ============================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found in PATH!
    pause
    exit /b 1
)

:: 2. Run automated test suite
echo [*] Step 1/3: Running Automated Test Suites...
call npm test
if %errorlevel% neq 0 (
    echo [ERROR] Tests failed! Aborting build.
    pause
    exit /b 1
)
echo.

:: 3. Generate icon assets if missing
if not exist "assets\icon.ico" (
    echo [*] Step 2/3: Generating multi-resolution icon assets...
    call npm run build:icon
) else (
    echo [*] Step 2/3: Icon assets verified (assets\icon.ico, assets\icon.png)
)
echo.

:: 4. Build Windows Installer (NSIS) and Portable Executable
echo [*] Step 3/3: Packaging with electron-builder...
echo Building NSIS Setup Installer and Portable Executable for Windows x64...
call npm run dist:all

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Check electron-builder output above.
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================================
echo             BUILD COMPLETED SUCCESSFULLY!
echo ============================================================
echo Artifacts created in dist/ folder:
dir /b dist\*.exe 2>nul
echo.
pause
