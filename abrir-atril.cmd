@echo off
rem Arranca el atril. No necesita Python ni Node: el servidor va en PowerShell,
rem que viene de serie en Windows.
title Atril de Locucion
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"
if errorlevel 1 (
  echo.
  echo    El atril no pudo arrancar. Copia el mensaje de arriba.
  echo.
  pause
)
