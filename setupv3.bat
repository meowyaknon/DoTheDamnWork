
@echo off
setlocal
cd /d "%~dp0"
title DoTheDamnWork Setup V3

echo ==========================================
echo       DoTheDamnWork Setup V3
echo ==========================================
echo.

if not exist "requirements.txt" (
    echo [ERROR] requirements.txt not found.
    goto :fail
)

if not exist "install_python.ps1" (
    echo [ERROR] install_python.ps1 not found.
    goto :fail
)

set "PYTHON_EXE="

REM 1. Try Python Launcher
where py >nul 2>&1
if not errorlevel 1 (
    py -3.13 -c "import sys; exit(0 if sys.version_info[:2] == (3,13) else 1)" >nul 2>&1
    if not errorlevel 1 (
        for /f "delims=" %%P in ('py -3.13 -c "import sys; print(sys.executable)"') do set "PYTHON_EXE=%%P"
    )
)

REM 2. Try python command
if not defined PYTHON_EXE (
    where python >nul 2>&1
    if not errorlevel 1 (
        python -c "import sys; exit(0 if sys.version_info[:2] == (3,13) else 1)" >nul 2>&1
        if not errorlevel 1 (
            for /f "delims=" %%P in ('python -c "import sys; print(sys.executable)"') do set "PYTHON_EXE=%%P"
        )
    )
)

REM 3. Try our dedicated installation path
if not defined PYTHON_EXE (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
    if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
        "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" -c "import sys; exit(0 if sys.version_info[:2] == (3,13) else 1)" >nul 2>&1
        if errorlevel 1 set "PYTHON_EXE="
    ) else (
        set "PYTHON_EXE="
    )
)

REM 4. Install Python if none found
if not defined PYTHON_EXE (
    echo [INFO] Compatible Python not found.
    echo [INFO] Installing Python 3.13.16...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_python.ps1"
    if errorlevel 1 goto :fail

    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
)

REM 5. Verify selected interpreter
"%PYTHON_EXE%" -c "import sys; exit(0 if sys.version_info[:2] == (3,13) else 1)"
if errorlevel 1 (
    echo [ERROR] Selected Python is not Python 3.13.
    goto :fail
)

echo [OK] Selected Python:
"%PYTHON_EXE%" --version
echo.

REM 6. Create or validate virtual environment
if exist ".venv\Scripts\python.exe" (
    echo [INFO] Existing .venv found.
    ".venv\Scripts\python.exe" -c "import sys; exit(0 if sys.version_info[:2] == (3,13) else 1)"
    if errorlevel 1 (
        echo [ERROR] Existing .venv uses an incompatible Python version.
        echo Back up and recreate .venv before retrying.
        goto :fail
    )
) else (
    echo [INFO] Creating virtual environment...
    "%PYTHON_EXE%" -m venv .venv
    if errorlevel 1 goto :fail
)

REM 7. Install dependencies
echo.
echo [INFO] Installing dependencies...
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :fail

REM 8. Verify imports
echo.
echo [INFO] Verifying packages...
".venv\Scripts\python.exe" -c "import cv2, torch, ultralytics, serial; print('OpenCV:', cv2.__version__); print('PyTorch:', torch.__version__); print('Ultralytics:', ultralytics.__version__); print('PySerial:', serial.__version__)"
if errorlevel 1 goto :fail

".venv\Scripts\python.exe" -m pip check
if errorlevel 1 goto :fail

echo.
echo ==========================================
echo Setup completed successfully!
echo Run your project using .venv Python.
echo ==========================================
pause
exit /b 0

:fail
echo.
echo [ERROR] Setup failed. Review the messages above.
pause
exit /b 1