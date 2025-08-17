@echo off
echo Starting Backend Server...
start cmd /k "cd backend && npm run start:dev"
timeout /t 3 /nobreak > nul
echo Starting Frontend Server...
start cmd /k "npm run dev"
echo Both servers starting...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:4000
pause
