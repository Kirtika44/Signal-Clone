@echo off
cd /d "%~dp0backend"
echo ====================================================
echo Starting Signal Clone FastAPI Backend (Port 8000)...
echo ====================================================
"C:\Users\LENOVO\anaconda3\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
