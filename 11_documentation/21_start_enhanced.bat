@echo off
echo ========================================
echo          optqo Platform v2.0
echo      Enhanced Interface Launcher
echo ========================================
echo.

echo [1/3] Installing dependencies...
call npm install express cors 2>nul
if %errorlevel% neq 0 (
    echo Warning: Could not install dependencies automatically
    echo Please run: npm install express cors
    echo.
)

echo [2/3] Starting enhanced server...
echo Server will be available at: http://localhost:3000
echo.

echo [3/3] Launching interface...
start "" "http://localhost:3000"

echo Starting optqo Platform Enhanced Server...
echo Features: Workspace Management, File Browser, Crew Analysis
echo.

node 16_scripts\simple_enhanced_server.js

pause
