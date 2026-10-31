@echo off
chcp 65001 > nul

title WinRead - Automated Test Suite Runner

echo ============================================================
echo           WinRead: Ultra-Optimized Reader Test Suite
echo ============================================================
echo.

:: Check Node.js availability
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js LTS or add it to PATH.
    echo.
    pause
    exit /b 1
)

:: Run test suite
echo [*] Executing automated tests (node test/run-tests.js)...
echo.
node test/run-tests.js
set TEST_EXIT_CODE=%errorlevel%

echo.
if %TEST_EXIT_CODE% equ 0 (
    echo ============================================================
    echo           [SUCCESS] All test suites passed successfully
    echo ============================================================
) else (
    echo ============================================================
    echo           [FAILURE] Some tests failed (Exit Code: %TEST_EXIT_CODE%)
    echo ============================================================
)

echo.
pause
exit /b %TEST_EXIT_CODE%
