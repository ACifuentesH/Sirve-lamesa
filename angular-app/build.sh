#!/bin/bash

# Script para construir la aplicación Angular para producción

echo "🔨 Construyendo aplicación Angular..."

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias..."
  npm install
fi

# Construir para producción
echo "🏗️ Ejecutando build de producción..."
npm run build:prod

echo "✅ Build completado en dist/sirve-la-mesa/"
