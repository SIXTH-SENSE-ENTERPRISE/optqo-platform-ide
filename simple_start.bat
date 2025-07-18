@echo off
echo Starting optqo Platform Server (Simplified)...
cd /d "c:\00_AI_PROJECTS\37_optqo_IDE_Cli"

echo Checking Node.js...
node --version
if errorlevel 1 (
    echo Node.js not found! Please install from nodejs.org
    pause
    exit
)

echo Installing dependencies...
npm install express 2>nul

echo Starting working server...
echo Server will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
node 07_interface/servers/08_working_server.js

pause
