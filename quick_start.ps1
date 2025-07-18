Write-Host "Starting optqo Platform Server..." -ForegroundColor Green
Set-Location "c:\00_AI_PROJECTS\37_optqo_IDE_Cli"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host "Starting server on port 3000..." -ForegroundColor Cyan
node "07_interface/servers/08_working_server.js"
Read-Host "Press Enter to exit"
