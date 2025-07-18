@echo off
echo =======================================================
echo optqo Platform - Workspace Cleanup Utility
echo =======================================================
echo.
echo This script will clean temporary files and old analysis data
echo.
pause

echo Removing old analysis files from root...
del /q "analysis-*.json" 2>nul

echo Cleaning github repository projects...
for /d %%i in (github-repos\*) do (
    echo   Removing %%i
    rmdir /s /q "%%i" 2>nul
)

echo Cleaning local project workspaces...
for /d %%i in (local-projects\*) do (
    echo   Removing %%i
    rmdir /s /q "%%i" 2>nul
)

echo Cleaning any temporary folders...
rmdir /s /q "is" 2>nul
rmdir /s /q "analysis-results" 2>nul
rmdir /s /q "reports" 2>nul

echo.
echo =======================================================
echo Workspace cleanup completed!
echo =======================================================
pause
