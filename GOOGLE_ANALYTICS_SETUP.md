# Configuración de Google Analytics

## Pasos para configurar Google Analytics en el sitio web:

### 1. Crear una cuenta de Google Analytics
1. Ve a [Google Analytics](https://analytics.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Comenzar" si es tu primera vez

### 2. Configurar una propiedad
1. Selecciona "Crear cuenta"
2. Introduce el nombre de la cuenta (ej: "Conferencias Tech España")
3. Configura la propiedad:
   - Nombre de la propiedad: "conferencias-tech-espana.github.io"
   - Zona horaria: España (GMT+1)
   - Moneda: Euro

### 3. Configurar el flujo de datos
1. Selecciona "Web" como plataforma
2. Introduce la URL del sitio web: `https://conferencias-tech-espana.github.io`
3. Introduce el nombre del sitio: "Conferencias Tech España"

### 4. Obtener el ID de medición
1. Una vez creado, encontrarás un ID que empieza con "G-" (ej: G-XXXXXXXXXX)
2. Copia este ID

### 5. Configurar en el sitio web
1. Abre el archivo `_config.yml`
2. Reemplaza `G-XXXXXXXXXX` con tu ID real:
   ```yaml
   google_analytics: "G-TU-ID-AQUI"
   ```

### 6. Verificar que funciona
1. Despliega el sitio web
2. Ve a Google Analytics
3. En "Tiempo real" deberías ver las visitas

## Métricas que podrás ver:
- Número de visitantes únicos
- Páginas más visitadas
- Países de origen de las visitas
- Dispositivos utilizados (móvil, desktop, tablet)
- Fuentes de tráfico (directo, búsqueda, redes sociales)

## Notas importantes:
- Los datos aparecen con un retraso de 24-48 horas (excepto "Tiempo real")
- Cumple con GDPR automáticamente al usar GA4
- No se requiere banner de cookies para analíticas básicas en Europa