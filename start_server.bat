@echo off
title optqo Platform Server
color 0A

echo ====================================================
echo           optqo Platform Server Startup
echo ====================================================
echo.

echo [1/4] Stopping any existing Node.js processes...
taskkill /IM node.exe /F 2>nul
if errorlevel 1 (
    echo No existing Node.js processes found.
) else (
    echo Existing Node.js processes stopped.
)

echo.
echo [2/4] Navigating to project directory...
cd /d "c:\00_AI_PROJECTS\37_optqo_IDE_Cli"
echo Current directory: %cd%

echo.
echo [3/4] Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js
    pause
    exit /b 1
)
echo Node.js is ready.

echo.
echo [4/4] Starting optqo Platform Server...
echo Server will be available at: http://localhost:3000
echo Target directories:
echo   - Local uploads: 08_workspace/local-projects/
echo   - GitHub clones: 08_workspace/github-repos/
echo.
echo Press Ctrl+C to stop the server
echo ====================================================
echo.

node 07_interface/servers/08_working_server.js

echo.
echo Server stopped.
pause
