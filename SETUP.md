# Configuración del Proyecto

## Prerrequisitos

Para ejecutar este proyecto en tu máquina local necesitas:

- **Ruby** (versión 2.7 o superior)
- **Bundler** (instalador de gemas de Ruby)
- **Git**

### Instalación de Ruby

#### macOS
```bash
# Usando Homebrew
brew install ruby

# O usando rbenv (recomendado)
brew install rbenv
rbenv install 3.1.0
rbenv global 3.1.0
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ruby-full
```

#### Windows
Descarga e instala desde [RubyInstaller](https://rubyinstaller.org/)

## Configuración Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/[tu-usuario]/tech-conferences-spain.git
cd tech-conferences-spain
```

### 2. Instalar dependencias
```bash
# Instalar Bundler si no lo tienes
gem install bundler

# Instalar todas las gemas del proyecto
bundle install
```

### 3. Ejecutar el sitio web localmente
```bash
# Servir el sitio en modo desarrollo
bundle exec jekyll serve

# Con recarga automática
bundle exec jekyll serve --livereload
```

El sitio estará disponible en: `http://localhost:4000`

## Comandos Útiles

### Desarrollo
```bash
# Servir el sitio con drafts
bundle exec jekyll serve --drafts

# Limpiar archivos generados
bundle exec jekyll clean

# Construir para producción
bundle exec jekyll build
```

### Actualizar dependencias
```bash
# Actualizar todas las gemas
bundle update

# Actualizar una gema específica
bundle update jekyll
```

## Estructura del Proyecto

```
├── _conferences/           # Archivos de conferencias (.md)
├── _includes/             # Parciales de Jekyll
├── _layouts/              # Plantillas de Jekyll
├── _sass/                 # Archivos SCSS
├── css/                   # CSS compilado
├── img/                   # Imágenes
├── _config.yml            # Configuración de Jekyll
├── Gemfile                # Dependencias de Ruby
├── Gemfile.lock           # Versiones exactas de las gemas
└── index.html             # Página principal
```

## Añadir una Nueva Conferencia

1. Crea un archivo `.md` en la carpeta apropiada dentro de `_conferences/`
2. Usa el siguiente formato:

```yaml
---
name: "Nombre de la Conferencia"
website: https://ejemplo.com
twitter: https://twitter.com/evento
location: Ciudad, España

date_start: 2024-06-15
date_end: 2024-06-16

cfp_start: 2024-01-15
cfp_end: 2024-03-15
cfp_site: https://cfp.ejemplo.com
---
```

## Solución de Problemas

### Error: "Could not find gem 'github-pages'"
```bash
bundle install
```

### Error: "Permission denied"
```bash
# En macOS/Linux, usar rbenv en lugar de Ruby del sistema
rbenv install 3.1.0
rbenv global 3.1.0
gem install bundler
```

### Error: "Port 4000 already in use"
```bash
# Usar otro puerto
bundle exec jekyll serve --port 4001
```

### Error: "Bundler version mismatch"
```bash
gem install bundler:2.6.5
bundle _2.6.5_ install
```

## Deployment

Este proyecto está configurado para GitHub Pages. Cualquier push a la rama `master` desplegará automáticamente el sitio.

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-conferencia`)
3. Commit tus cambios (`git commit -am 'Añadir ConferenciaX 2024'`)
4. Push a la rama (`git push origin feature/nueva-conferencia`)
5. Abre un Pull Request

## Soporte

Si tienes problemas con la configuración, por favor:

1. Verifica que tengas Ruby 2.7+: `ruby --version`
2. Verifica que Bundler esté instalado: `bundle --version`
3. Ejecuta `bundle install` de nuevo
4. Abre un issue en GitHub con el error completo