$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js no está instalado. Instala la versión 18.18 o superior.'
}
if (-not (Test-Path 'node_modules')) { npm install }
if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }
Start-Process 'http://localhost:3000'
npm start
