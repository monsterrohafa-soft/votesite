@echo off
chcp 65001 >nul 2>&1
title SNS Search - Chrome + Google

cd /d "%~dp0"

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Install from python.org
    pause
    exit /b
)

echo ============================================================
echo   SNS Search with Chrome + Google
echo ============================================================
echo.
echo   Installing packages...
pip install undetected-chromedriver selenium webdriver-manager openpyxl -q 2>nul
echo   Done!
echo.
echo   1. Incomplete batches only
echo   2. Full re-search (2,810 / ~90min)
echo   3. Excel merge only
echo   4. Specific batch number
echo.
set /p choice="  Select (1/2/3/4): "

if "%choice%"=="1" (
    echo.
    python -u sns_search_chrome.py --delay 3
) else if "%choice%"=="2" (
    echo.
    python -u sns_search_chrome.py --reprocess --delay 3
) else if "%choice%"=="3" (
    echo.
    python -u sns_search_chrome.py --merge-only
) else if "%choice%"=="4" (
    set /p bnum="  Batch number (1-17): "
    echo.
    python -u sns_search_chrome.py --batch %bnum% --delay 3
) else (
    echo   Invalid.
    pause
    exit /b
)

echo.
echo ============================================================
echo   Done!
echo ============================================================
pause
