# 🗺️ Configuración de Google Maps

## Problema

La API key de Google Maps está restringida al dominio `techconf.es` y no funciona en desarrollo local (`localhost:4000`).

## 🔧 Soluciones

### 1. **Configurar restricciones en Google Cloud Console** (Recomendado)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Selecciona tu API key
3. En **"Restricciones de aplicación"** → **"Referentes HTTP"**
4. Agrega estos dominios:
   ```
   techconf.es/*
   *.techconf.es/*
   localhost:4000/*
   127.0.0.1:4000/*
   ```

### 2. **Usar el servidor de desarrollo con fallback** (Implementado)

El proyecto incluye un **fallback automático a Leaflet.js** cuando Google Maps falla:

```bash
# Usar el script de desarrollo
./serve-dev.sh

# O manualmente:
bundle exec jekyll serve --config _config.yml,_config_dev.yml --port 4000 --livereload
```

**Características del fallback:**
- ✅ **Detección automática** de errores de Google Maps
- ✅ **Carga dinámica** de Leaflet.js como alternativa
- ✅ **Misma funcionalidad** (marcadores, popups, eventos)
- ✅ **Mensaje informativo** para el usuario

### 3. **API key separada para desarrollo**

Editar `_config_dev.yml`:
```yaml
google_maps_api_key_dev: "TU_API_KEY_DE_DESARROLLO"
```

## 🚀 Uso en Desarrollo

### Opción A: Script automático
```bash
./serve-dev.sh
```

### Opción B: Jekyll directo
```bash
bundle exec jekyll serve --config _config.yml,_config_dev.yml --port 4000 --livereload
```

## 🎯 Resultado

- **Si Google Maps funciona**: Mapa con estilo Google Maps
- **Si Google Maps falla**: Fallback automático a Leaflet.js con OpenStreetMap
- **Funcionalidad idéntica**: Marcadores, popups, información de eventos

## 📁 Archivos

- `_config_dev.yml` - Configuración para desarrollo
- `serve-dev.sh` - Script de inicio para desarrollo
- `map.html` - Página del mapa con fallback automático

## ⚡ Estado Actual

El mapa **funciona en desarrollo** con fallback a Leaflet.js cuando Google Maps está restringido.