# Assets de Landing Page

## Estructura de Carpetas

```
src/assets/landing/
├── README.md (este archivo)
├── tech/ (logos de tecnologías)
│   ├── react.svg
│   ├── typescript.svg
│   ├── supabase.svg
│   ├── vercel.svg
│   └── tailwind.svg
├── dashboard-screenshot.png
├── calendar-screenshot.png
├── checkin-screenshot.png
├── waitlist-screenshot.png
├── incidents-screenshot.png
├── notifications-screenshot.png
├── warnings-screenshot.png
├── offline-screenshot.png
└── admin-screenshot.png
```

## Screenshots Necesarios

### 1. Dashboard (dashboard-screenshot.png)
- **Qué capturar**: Vista principal del dashboard de usuario
- **Incluir**: 
  - Sección "Hoy" con reserva activa
  - Card de check-in
  - Calendario mensual
  - Navegación
- **Tamaño recomendado**: 1200x800px
- **Formato**: PNG o WebP

### 2. Calendario (calendar-screenshot.png)
- **Qué capturar**: Vista del calendario de reservas
- **Incluir**:
  - Calendario mensual completo
  - Días con disponibilidad (verde/rojo)
  - Leyenda de colores
- **Tamaño recomendado**: 1200x800px
- **Formato**: PNG o WebP

### 3. Check-in (checkin-screenshot.png)
- **Qué capturar**: Card de check-in en dashboard
- **Incluir**:
  - Botón de check-in
  - Información de reserva
  - Estado de check-in
- **Tamaño recomendado**: 800x600px
- **Formato**: PNG o WebP

### 4. Waitlist (waitlist-screenshot.png)
- **Qué capturar**: Dashboard de lista de espera
- **Incluir**:
  - Listas activas
  - Posición en cola
  - Ofertas pendientes
- **Tamaño recomendado**: 1200x800px
- **Formato**: PNG o WebP

### 5. Incidentes (incidents-screenshot.png)
- **Qué capturar**: Flujo de reporte de incidente
- **Incluir**:
  - Captura de foto
  - Formulario de matrícula
  - Reasignación de plaza
- **Tamaño recomendado**: 800x1200px (vertical para móvil)
- **Formato**: PNG o WebP

### 6. Notificaciones (notifications-screenshot.png)
- **Qué capturar**: Panel de notificaciones
- **Incluir**:
  - Lista de notificaciones
  - Badge de contador
  - Diferentes tipos de notificaciones
- **Tamaño recomendado**: 600x800px
- **Formato**: PNG o WebP

### 7. Advertencias (warnings-screenshot.png)
- **Qué capturar**: Perfil de usuario con advertencias
- **Incluir**:
  - Lista de advertencias
  - Contador visual
  - Detalles de infracciones
- **Tamaño recomendado**: 1200x800px
- **Formato**: PNG o WebP

### 8. Offline (offline-screenshot.png)
- **Qué capturar**: Indicador de modo offline
- **Incluir**:
  - Banner de offline
  - Datos en caché
  - Indicador de sincronización
- **Tamaño recomendado**: 1200x600px
- **Formato**: PNG o WebP

### 9. Admin (admin-screenshot.png)
- **Qué capturar**: Panel de administración
- **Incluir**:
  - Editor visual de plazas
  - Estadísticas
  - Gestión de usuarios
- **Tamaño recomendado**: 1400x900px
- **Formato**: PNG o WebP

## Logos de Tecnologías

Los logos se pueden obtener de:
- **React**: https://react.dev/ (oficial)
- **TypeScript**: https://www.typescriptlang.org/ (oficial)
- **Supabase**: https://supabase.com/brand-assets (oficial)
- **Vercel**: https://vercel.com/design (oficial)
- **Tailwind CSS**: https://tailwindcss.com/brand (oficial)

O usar el MCP de 21st.dev para buscar logos:
```
/logo React TypeScript Supabase Vercel Tailwind
```

## Optimización de Imágenes

### Herramientas Recomendadas

1. **Compresión PNG**: TinyPNG (https://tinypng.com/)
2. **Conversión a WebP**: Squoosh (https://squoosh.app/)
3. **Redimensionado**: ImageMagick o Sharp

### Comandos de Optimización

```bash
# Convertir PNG a WebP (requiere cwebp)
cwebp -q 80 input.png -o output.webp

# Redimensionar con ImageMagick
convert input.png -resize 1200x800 output.png

# Comprimir PNG
pngquant --quality=65-80 input.png --output output.png
```

### Script Node.js con Sharp

```javascript
const sharp = require('sharp');

async function optimizeImage(input, output) {
  await sharp(input)
    .resize(1200, 800, { fit: 'inside' })
    .webp({ quality: 80 })
    .toFile(output);
}

optimizeImage('dashboard.png', 'dashboard-screenshot.webp');
```

## Placeholders Temporales

Mientras se capturan los screenshots reales, puedes usar:

1. **Placeholder.com**: https://placeholder.com/
2. **Unsplash**: https://unsplash.com/ (fotos de parking)
3. **Pexels**: https://www.pexels.com/ (fotos de oficinas)

Ejemplo de placeholder:
```html
<img src="https://via.placeholder.com/1200x800/1a1a1a/ffffff?text=Dashboard+Screenshot" alt="Dashboard" />
```

## Checklist de Preparación

- [ ] Crear carpeta `src/assets/landing/`
- [ ] Crear subcarpeta `tech/` para logos
- [ ] Capturar screenshot del dashboard
- [ ] Capturar screenshot del calendario
- [ ] Capturar screenshot de check-in
- [ ] Capturar screenshot de waitlist
- [ ] Capturar screenshot de incidentes
- [ ] Capturar screenshot de notificaciones
- [ ] Capturar screenshot de advertencias
- [ ] Capturar screenshot de modo offline
- [ ] Capturar screenshot del panel admin
- [ ] Descargar logos de tecnologías
- [ ] Optimizar todas las imágenes (WebP, compresión)
- [ ] Verificar tamaños y formatos
- [ ] Actualizar rutas en `landingContent.ts` si es necesario

## Notas

- **Formato preferido**: WebP para mejor compresión
- **Fallback**: PNG para compatibilidad
- **Tamaño máximo**: 500KB por imagen
- **Responsive**: Considerar versiones mobile si es necesario
- **Alt text**: Siempre incluir descripciones accesibles
