# Quick Start: Logo para Emails

## 🚀 Opción 1: Logo Placeholder (2 minutos)

Mientras preparas tu logo real, usa un placeholder:

```bash
# Generar logo placeholder con gradiente de Reserveo
node scripts/generate-placeholder-logo.js

# Desplegar
git add public/logo-email.png
git commit -m "feat: add email logo placeholder"
git push

# Verificar (después del deploy)
curl -I https://reserveo.app/logo-email.png
```

✅ **Listo!** Los emails ya mostrarán el logo placeholder.

---

## 🎨 Opción 2: Tu Logo Real (10 minutos)

### Paso 1: Optimizar Logo

**Método A: Script Automatizado (Más Fácil) ⭐**
```bash
# Instalar sharp (solo primera vez)
npm install sharp

# Optimizar logo automáticamente
node scripts/optimize-logo-for-email.js logo-original.png

# O si está en otra ubicación:
node scripts/optimize-logo-for-email.js ~/Downloads/logo.png
```

**Método B: Online**
1. Ir a https://tinypng.com/
2. Subir tu logo
3. Descargar versión optimizada
4. Guardar como `public/logo-email.png`

**Método C: ImageMagick**
```bash
convert logo-original.png -resize 64x64 -quality 85 public/logo-email.png
```

### Paso 2: Verificar Especificaciones

```bash
# Verificar tamaño del archivo
ls -lh public/logo-email.png

# Debe ser:
# - Tamaño: 64x64px (o 48x48px, 96x96px)
# - Peso: < 10KB (idealmente < 5KB)
# - Formato: PNG con transparencia
```

### Paso 3: Desplegar

```bash
git add public/logo-email.png
git commit -m "feat: add optimized email logo"
git push

# Vercel desplegará automáticamente
```

### Paso 4: Verificar

```bash
# Verificar que es accesible
curl -I https://reserveo.app/logo-email.png
# Debe retornar: HTTP/2 200

# Ver en navegador
open https://reserveo.app/logo-email.png
```

### Paso 5: Probar Email

```sql
-- Desde Supabase SQL Editor
SELECT send_notification_email(
  'tu-email@gmail.com',
  'Tu Nombre',
  'waitlist_offer',
  'Prueba de Logo',
  'Verificando que el logo se ve correctamente',
  'high',
  'system',
  '{}'::jsonb,
  'https://reserveo.app'
);
```

✅ **Listo!** Verifica el email en tu bandeja de entrada.

---

## 🔍 Troubleshooting

### Logo no se muestra

```bash
# 1. Verificar que existe
ls -la public/logo-email.png

# 2. Verificar que se desplegó
curl -I https://reserveo.app/logo-email.png

# 3. Verificar en navegador privado
open -a "Google Chrome" --args --incognito https://reserveo.app/logo-email.png
```

### Logo muy grande

```bash
# Optimizar con ImageMagick
convert public/logo-email.png -resize 64x64 -quality 85 public/logo-email-optimized.png
mv public/logo-email-optimized.png public/logo-email.png

# O usar: https://tinypng.com/
```

### Logo pixelado

```bash
# Usar logo de mayor resolución (96x96px)
convert logo-original.png -resize 96x96 -quality 90 public/logo-email.png
```

---

## 📚 Documentación Completa

- **Guía detallada:** `docs/LOGO-EMAIL-SETUP.md`
- **Resumen técnico:** `docs/LOGO-HOSTEADO-RESUMEN.md`
- **Mejores prácticas:** `docs/EMAIL-BEST-PRACTICES.md`

---

## ⏱️ Tiempo Total

- **Opción 1 (Placeholder):** 2 minutos
- **Opción 2 (Logo real):** 10 minutos

---

## ✨ Resultado

Emails profesionales con tu logo visible en:
- ✅ Gmail (web y móvil)
- ✅ Outlook (web y desktop)
- ✅ Apple Mail
- ✅ Otros clientes populares

**¿Dudas?** Consulta `docs/LOGO-EMAIL-SETUP.md`
