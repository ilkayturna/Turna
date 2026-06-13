@echo off
title Turna SMS Local Proxy
color 0A
echo.
echo  ============================================
echo     Turna SMS - Local Proxy Baslatiliyor
echo  ============================================
echo.
echo  Port: 3001
echo  UI:  https://turna.vercel.app (otomatik baglanir)
echo.
echo  Press CTRL+C to stop
echo.
cd /d "%~dp0"
node local-dev.mjs
pause
