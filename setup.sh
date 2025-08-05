#!/bin/bash

# Setup script for Conferencias Tech España
# This script automates the initial setup of the project

set -e  # Exit on any error

echo "🇪🇸 Configurando Conferencias Tech España..."
echo ""

# Check if Ruby is installed
if ! command -v ruby &> /dev/null; then
    echo "❌ Ruby no está instalado. Por favor instala Ruby 2.7+ primero:"
    echo "   macOS: brew install ruby"
    echo "   Ubuntu: sudo apt install ruby-full"
    echo "   Windows: https://rubyinstaller.org/"
    exit 1
fi

echo "✅ Ruby encontrado: $(ruby --version)"

# Check if Bundler is installed
if ! command -v bundle &> /dev/null; then
    echo "📦 Instalando Bundler..."
    gem install bundler
else
    echo "✅ Bundler encontrado: $(bundle --version)"
fi

# Install dependencies
echo "📚 Instalando dependencias de Ruby..."
bundle install

# Check if everything is working
echo "🧪 Verificando instalación..."
if bundle exec jekyll --version &> /dev/null; then
    echo "✅ Jekyll está funcionando correctamente"
else
    echo "❌ Error al verificar Jekyll"
    exit 1
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "Para ejecutar el sitio web localmente:"
echo "   bundle exec jekyll serve"
echo ""
echo "El sitio estará disponible en: http://localhost:4000"
echo ""
echo "Para más información, consulta SETUP.md"