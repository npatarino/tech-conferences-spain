#!/bin/bash

# Script para servir el sitio en modo desarrollo
# Usa configuración específica para desarrollo local

echo "🚀 Iniciando servidor de desarrollo..."
echo "📋 Configuración: desarrollo local con fallback a Leaflet.js"
echo "🌐 URL: http://localhost:4000"
echo ""

# Detener cualquier Jekyll que esté corriendo
pkill -f "jekyll serve" 2>/dev/null

# Iniciar Jekyll con configuración de desarrollo
bundle exec jekyll serve --config _config.yml,_config_dev.yml --port 4000 --livereload --host 0.0.0.0