@echo off
rem Genera herramientas\atril-de-locucion.zip para enviar a un cliente.
title Empaquetar el atril
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0empaquetar.ps1"
pause
