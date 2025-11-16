# Configuración del Logo para Emails - RESERVEO

## 🎯 Estrategia: Logo Hosteado (Recomendado)

Usamos un logo hosteado en lugar de base64 por estas razones:

### Ventajas ✅
- **Emails más ligeros**: No aumenta el tamaño del HTML
- **Fácil de actualizar**: Cambias el archivo y todos los emails futuros usan el nuevo logo
- **Mejor deliverability**: Emails más pequeños = menos probabilidad de spam
- **Cache del navegador**: Los clientes de email pueden cachear la imagen
- **Sin límites de tamaño**: No hay restricción de tamaño del email

### Desventajas ⚠️
- Requiere que el logo esté públicamente accesible
- Si el servidor cae, el logo no se muestra (muy raro con Vercel)
- Algunos clientes de email bloquean imágenes por defecto (pero esto pasa con cualquier imagen)

## 📋 Pasos para Configurar

### 1. Preparar el Logo (10 min)

**Especificaciones:**
- **Tamaño:** 48x48px, 64x64px o 96x96px (recomendado: 64x64px)
- **Formato:** PNG con transparencia
- **Peso:** < 10KB (idealmente < 5KB)
- **Fondo:** Transparente o blanco

**Optimizar el logo:**

```bash
# Opción 1: Usar herramientas online
# 1. Ir a https://tinypng.com/
# 2. Subir tu logo
# 3. Descargar versión optimizada

# Opción 2: Usar ImageMagick (si lo tienes instalado)
convert logo-original.png -resize 64x64 -quality 85 logo-email.png

# Opción 3: Usar sharp (Node.js)
npm install -g sharp-cli
sharp -i logo-original.png -o logo-email.png resize 64 64
```

### 2. Colocar el Logo en el Proyecto

```bash
# Copiar logo optimizado a public/
cp logo-optimizado.png public/logo-email.png

# Verificar que existe
ls -lh public/logo-email.png
```

### 3. Verificar que se Despliega Correctamente

**En local:**
```bash
# Iniciar servidor de desarrollo
npm run dev

# Verificar en navegador:
# http://localhost:8080/logo-email.png
```

**En producción (después de deploy):**
```bash
# Verificar URL pública
curl -I https://reserveo.app/logo-email.png

# Debe retornar: HTTP/2 200
```

### 4. Actualizar URL en Edge Function (Ya hecho ✅)

El código ya está configurado para usar:
```typescript
const logoUrl = 'https://reserveo.app/logo-email.png'
```

### 5. Desplegar

```bash
# Commit y push
git add public/logo-email.png
git commit -m "feat: add optimized logo for emails"
git push

# Vercel desplegará automáticamente
# O manualmente:
vercel --prod

# Desplegar Edge Function (si hubo cambios)
supabase functions deploy send-notification
```

### 6. Probar

```bash
# Enviar email de prueba desde Supabase SQL Editor
SELECT send_notification_email(
  'tu-email@gmail.com',
  'Tu Nombre',
  'waitlist_offer',
  'Prueba de Logo',
  'Este email debe mostrar el logo de Reserveo',
  'high',
  'system',
  '{}'::jsonb,
  'https://reserveo.app'
);
```

**Verificar:**
- [ ] Email recibido
- [ ] Logo se muestra correctamente
- [ ] Logo tiene buen tamaño (no pixelado)
- [ ] Logo se ve en Gmail, Outlook, Apple Mail

## 🔄 Alternativa: Logo con CDN

Si quieres aún mejor performance, puedes usar un CDN:

### Opción 1: Cloudinary (Gratis)
```typescript
const logoUrl = 'https://res.cloudinary.com/tu-cuenta/image/upload/v1/reserveo-logo.png'
```

### Opción 2: Imgix
```typescript
const logoUrl = 'https://reserveo.imgix.net/logo-email.png?w=64&h=64&auto=format'
```

### Opción 3: Vercel Blob Storage
```typescript
const logoUrl = 'https://blob.vercel-storage.com/reserveo-logo-xxx.png'
```

## 🎨 Diseño del Logo

### Recomendaciones

**Para fondo claro (modo light):**
- Logo con colores de marca
- Fondo transparente
- Borde sutil si es necesario

**Para fondo oscuro (modo dark):**
- Considerar versión invertida del logo
- O usar logo que funcione en ambos modos

**Ejemplo de logo adaptativo:**
```html
<!-- Logo que se adapta al modo oscuro -->
<picture>
  <source srcset="https://reserveo.app/logo-email-dark.png" media="(prefers-color-scheme: dark)">
  <img src="https://reserveo.app/logo-email.png" alt="Reserveo Logo" width="64" height="64">
</picture>
```

### Colores de Marca Reserveo

Basado en el gradiente actual:
- **Primary:** #667eea (purple)
- **Secondary:** #764ba2 (violet)
- **Accent:** Blanco para contraste

## 🔍 Troubleshooting

### Logo no se muestra

**1. Verificar URL:**
```bash
curl -I https://reserveo.app/logo-email.png
# Debe retornar 200, no 404
```

**2. Verificar que es accesible públicamente:**
- Abrir URL en navegador privado
- No debe pedir autenticación

**3. Verificar CORS (si aplica):**
```bash
curl -H "Origin: https://mail.google.com" -I https://reserveo.app/logo-email.png
# Debe incluir: Access-Control-Allow-Origin
```

### Logo se ve pixelado

**Solución:**
- Usar logo de mayor resolución (96x96px)
- Especificar width y height en HTML
- Usar formato PNG, no JPG

### Logo muy pesado

**Solución:**
```bash
# Optimizar con TinyPNG
# O reducir tamaño:
convert logo.png -resize 64x64 -quality 85 logo-optimized.png
```

### Logo no se ve en Outlook

**Solución:**
- Verificar que width y height están especificados
- Usar PNG, no SVG
- Verificar que no hay CSS que oculte la imagen

## 📊 Comparativa: Base64 vs Hosteado

| Aspecto | Base64 | Hosteado |
|---------|--------|----------|
| **Tamaño del email** | +5-20KB | Sin cambio |
| **Velocidad de carga** | Instantáneo | Requiere request HTTP |
| **Actualización** | Requiere redeploy | Solo cambiar archivo |
| **Deliverability** | Peor (email más grande) | Mejor (email más pequeño) |
| **Compatibilidad** | 100% | 95% (algunos bloquean imágenes) |
| **Mantenimiento** | Difícil | Fácil |
| **Recomendado para** | Testing, logos muy pequeños | Producción |

## ✅ Checklist Final

- [ ] Logo optimizado a 64x64px
- [ ] Peso < 10KB
- [ ] Formato PNG con transparencia
- [ ] Colocado en `public/logo-email.png`
- [ ] Desplegado a producción
- [ ] URL accesible: `https://reserveo.app/logo-email.png`
- [ ] Edge Function actualizada (ya hecho ✅)
- [ ] Email de prueba enviado
- [ ] Logo se ve correctamente en Gmail, Outlook, Apple Mail

## 🚀 Próximos Pasos

1. **Optimizar logo actual** (10 min)
2. **Colocar en public/** (1 min)
3. **Desplegar a Vercel** (2 min)
4. **Probar email** (5 min)

**Tiempo total:** ~20 minutos

## 📚 Referencias

- [TinyPNG](https://tinypng.com/) - Optimización de imágenes
- [Squoosh](https://squoosh.app/) - Optimización avanzada
- [ImageOptim](https://imageoptim.com/) - Herramienta de escritorio
- [Can I Email - Images](https://www.caniemail.com/features/image-png/) - Compatibilidad

---

**Nota:** El logo hosteado es la mejor práctica para emails en producción. Solo usa base64 para testing o si tienes requisitos muy específicos.
