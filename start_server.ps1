Write-Host "Starting optqo Platform Working Server..." -ForegroundColor Green
Set-Location "c:\00_AI_PROJECTS\37_optqo_IDE_Cli"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host "Starting CommonJS Node.js server (more compatible)..." -ForegroundColor Yellow
node "07_interface/servers/08_working_server.js"
