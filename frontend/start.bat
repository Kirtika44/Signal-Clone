@echo off
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
echo Starting Next.js on 0.0.0.0:3000...
node_modules\.bin\next start -p 3000 -H 0.0.0.0
