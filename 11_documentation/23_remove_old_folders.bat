@echo off
echo ========================================
echo      Removing Old Folders
echo ========================================

cd /d "c:\00_AI_PROJECTS\37_optqo_IDE_Cli"

echo Stopping any running Electron processes...
taskkill /f /im electron.exe >nul 2>&1

echo.
echo Removing old folders...

if exist "06_tests" (
    rmdir /s /q "06_tests"
    echo ✓ Removed: 06_tests
) else (
    echo ! 06_tests not found
)

if exist "10_demo" (
    rmdir /s /q "10_demo"
    echo ✓ Removed: 10_demo
) else (
    echo ! 10_demo not found
)

if exist "12_gui_outputs" (
    rmdir /s /q "12_gui_outputs"
    echo ✓ Removed: 12_gui_outputs
) else (
    echo ! 12_gui_outputs not found
)

if exist "13_gui_repos" (
    rmdir /s /q "13_gui_repos"
    echo ✓ Removed: 13_gui_repos
) else (
    echo ! 13_gui_repos not found
)

echo.
echo ========================================
echo      Cleanup Complete!
echo ========================================
echo.
echo ✅ Folder reorganization finished!
echo ✅ New structure is ready to use
echo.
echo Start the enhanced platform with:
echo    npm run server
echo    or
echo    start_enhanced.bat
echo.
pause
