@echo off
title RouteCode Tauri Desktop Dev Environment
echo ===========================================================
echo    🚀 RouteCode Studio - Launching Native Tauri Client 🚀
echo ===========================================================
echo.
echo [1/2] Resolving project directory paths...
cd /d "%~dp0\apps\desktop-t"
echo.
echo [2/2] Booting Vite hot-reloading + Cargo backend compilation...
echo.
npm run tauri dev
echo.
echo ⚠️ Development server exited.
pause
