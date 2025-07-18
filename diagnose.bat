@echo off
echo ============================================
echo optqo Platform Server Diagnostic Tool
echo ============================================
echo.

echo Step 1: Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo ✓ Node.js is installed

echo.
echo Step 2: Checking current directory...
echo Current directory: %cd%
echo Expected directory: c:\00_AI_PROJECTS\37_optqo_IDE_Cli

echo.
echo Step 3: Checking if we're in the right directory...
if not exist "package.json" (
    echo ERROR: package.json not found in current directory
    echo Please make sure you're in: c:\00_AI_PROJECTS\37_optqo_IDE_Cli
    pause
    exit /b 1
)
echo ✓ Found package.json

echo.
echo Step 4: Checking for Express dependency...
npm list express 2>nul
if errorlevel 1 (
    echo WARNING: Express not found, installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)
echo ✓ Express is available

echo.
echo Step 5: Checking if port 3000 is available...
netstat -ano | findstr :3000
if not errorlevel 1 (
    echo WARNING: Port 3000 is already in use
    echo Trying to kill existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F 2>nul
)

echo.
echo Step 6: Testing simple Node.js server...
echo Starting test server for 5 seconds...
timeout /t 5 /nobreak >nul & taskkill /IM node.exe /F 2>nul & (
    echo Testing Node.js...
    echo Node version: && node -e "console.log(process.version)"
    echo Starting simple HTTP server...
    node -e "
    const http = require('http');
    const server = http.createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Test server is working!');
    });
    server.listen(3000, () => {
        console.log('✓ Simple server started on http://localhost:3000');
        console.log('Press Ctrl+C to stop...');
    });
    "
)

pause
