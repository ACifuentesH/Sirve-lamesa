# Script PowerShell para construir la aplicación Angular para producción

Write-Host "🔨 Construyendo aplicación Angular..." -ForegroundColor Green

# Verificar si existen las dependencias
if (!(Test-Path "node_modules")) {
  Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
  npm install
}

# Construir para producción
Write-Host "🏗️ Ejecutando build de producción..." -ForegroundColor Yellow
npm run build:prod

Write-Host "✅ Build completado en dist/sirve-la-mesa/" -ForegroundColor Green
