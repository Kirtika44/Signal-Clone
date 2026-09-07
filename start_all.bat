@echo off
echo ========================================================
echo Launching Signal Clone Full Stack (Backend + Frontend)
echo ========================================================
start "Signal Backend" cmd /c "%~dp0run_backend.bat"
timeout /t 2 /nobreak >nul
start "Signal Frontend" cmd /c "%~dp0run_frontend.bat"
echo.
echo Both servers are starting!
echo Backend:  http://localhost:8000 (API & Docs at /docs)
echo Frontend: http://localhost:3000
echo.
