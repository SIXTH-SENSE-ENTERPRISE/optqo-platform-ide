@echo off
echo Stopping any existing Node.js processes...
taskkill /IM node.exe /F 2>nul

echo Starting Working Server with Upload Support...
cd /d "c:\00_AI_PROJECTS\37_optqo_IDE_Cli"
echo Current directory: %cd%
echo.
echo Server starting at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
node 07_interface/servers/08_working_server.js
pause
