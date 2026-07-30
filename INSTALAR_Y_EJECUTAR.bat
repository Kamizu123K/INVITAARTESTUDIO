@echo off
setlocal
cd /d "%~dp0"
title Invita Arte Studio v1.1.0
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERROR: Node.js no esta instalado.
  echo Instala Node.js 18 o superior y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install
  if errorlevel 1 goto :error
)
if not exist .env (
  copy /Y .env.example .env >nul
  echo Se creo .env para modo local.
)
start "" http://localhost:3000
call npm start
exit /b %errorlevel%
:error
echo.
echo No se pudo preparar el proyecto. Revisa el mensaje anterior.
pause
exit /b 1
