@echo off
cd /d "%~dp0frontend"
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ====================================================
echo Starting Signal Clone Next.js Frontend (Port 3000)...
echo ====================================================
call npm run dev
pause
