@echo off
REM Start Vite dev server
start cmd /k "npm run dev"
REM Wait a few seconds for server to start
ping 127.0.0.1 -n 5 > nul
REM Launch default browser to localhost:3000
start http://localhost:3000/
