@echo off
echo ================================================
echo          optqo Platform v2.0
echo        Folder Cleanup & Reorganization
echo ================================================
echo.

cd /d "c:\00_AI_PROJECTS\37_optqo_IDE_Cli"

echo [1/4] Renaming 06_tests to 06_quality_assurance...
if exist "06_tests" (
    if not exist "06_quality_assurance" (
        ren "06_tests" "06_quality_assurance"
        echo ✓ Renamed: 06_tests → 06_quality_assurance
    ) else (
        echo ! 06_quality_assurance already exists
    )
) else (
    echo ! 06_tests not found
)

echo.
echo [2/4] Moving 10_demo to 15_launcher\examples...
if exist "10_demo" (
    if not exist "15_launcher\examples" mkdir "15_launcher\examples"
    xcopy "10_demo\*" "15_launcher\examples\" /s /e /y >nul 2>&1
    if %errorlevel% equ 0 (
        rmdir "10_demo" /s /q >nul 2>&1
        echo ✓ Moved: 10_demo → 15_launcher\examples
    ) else (
        echo ! Failed to move 10_demo
    )
) else (
    echo ! 10_demo not found
)

echo.
echo [3/4] Moving 12_gui_outputs to 14_gui\01_outputs...
if exist "12_gui_outputs" (
    if not exist "14_gui\01_outputs" mkdir "14_gui\01_outputs"
    xcopy "12_gui_outputs\*" "14_gui\01_outputs\" /s /e /y >nul 2>&1
    if %errorlevel% equ 0 (
        rmdir "12_gui_outputs" /s /q >nul 2>&1
        echo ✓ Moved: 12_gui_outputs → 14_gui\01_outputs
    ) else (
        echo ! Failed to move 12_gui_outputs
    )
) else (
    echo ! 12_gui_outputs not found
)

echo.
echo [4/4] Moving 13_gui_repos to 14_gui\02_repos...
if exist "13_gui_repos" (
    if not exist "14_gui\02_repos" mkdir "14_gui\02_repos"
    xcopy "13_gui_repos\*" "14_gui\02_repos\" /s /e /y >nul 2>&1
    if %errorlevel% equ 0 (
        rmdir "13_gui_repos" /s /q >nul 2>&1
        echo ✓ Moved: 13_gui_repos → 14_gui\02_repos
    ) else (
        echo ! Failed to move 13_gui_repos
    )
) else (
    echo ! 13_gui_repos not found
)

echo.
echo ================================================
echo         Cleanup Complete!
echo ================================================
echo.
echo Reorganized structure:
echo ✓ 06_quality_assurance (was 06_tests)
echo ✓ 15_launcher\examples (was 10_demo)
echo ✓ 14_gui\01_outputs (was 12_gui_outputs)
echo ✓ 14_gui\02_repos (was 13_gui_repos)
echo.

pause
