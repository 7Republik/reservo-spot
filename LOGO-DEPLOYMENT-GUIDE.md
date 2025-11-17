# Guía de Despliegue del Nuevo Logo - RESERVEO

## 📋 Estado Actual

✅ **Logo fuente:** `public/logo_reserveo.png`  
✅ **HTML actualizado:** Referencias a favicon y Open Graph  
✅ **Edge Function actualizada:** Usa logo en emails  
⏳ **Pendiente:** Generar favicons en múltiples tamaños

---

## 🚀 Pasos para Completar el Despliegue

### Opción A: Usando Sharp (Recomendado)

```bash
# 1. Instalar sharp (si no está instalado)
npm install --save-dev sharp

# 2. Generar favicons automáticamente
node scripts/generate-favicons-with-sharp.js

# 3. Generar favicon.ico
# Usa: https://www.icoconverter.com/
# Sube: favicon-16x16.png, favicon.png, favicon-48x48.png
# Descarga: favicon.ico
# Guarda en: public/favicon.ico

# 4. Verificar archivos generados
ls -lh public/*.png public/*.ico
```

### Opción B: Usando Herramientas Online

```bash
# 1. Ir a https://realfavicongenerator.net/

# 2. Subir public/logo_reserveo.png

# 3. Configurar opciones:
#    - iOS: 180x180px
#    - Android: 192x192px
#    - Favicon: 32x32px, 16x16px

# 4. Descargar paquete generado

# 5. Extraer archivos a public/
#    - favicon.ico
#    - favicon.png (32x32)
#    - apple-touch-icon.png (180x180)

# 6. Copiar logo_reserveo.png como logo-email.png optimizado
cp public/logo_reserveo.png public/logo-email.png

# 7. Optimizar logo-email.png
# Usa: https://tinypng.com/
# Objetivo: < 10KB, 64x64px
```

---

## 📁 Archivos Necesarios

Después de generar los favicons, deberías tener:

```
public/
├── favicon.ico              # Multi-size (16x16, 32x32, 48x48)
├── favicon.png              # 32x32px
├── apple-touch-icon.png     # 180x180px
├── logo-email.png           # 64x64px (optimizado < 10KB)
└── logo_reserveo.png        # Original (fuente)
```

---

## 🔍 Verificación Local

```bash
# 1. Iniciar servidor de desarrollo
npm run dev

# 2. Abrir http://localhost:8080

# 3. Verificar favicon en pestaña del navegador

# 4. Verificar en DevTools:
#    - Network tab → Buscar favicon.ico
#    - Debe retornar 200, no 404

# 5. Probar en diferentes navegadores:
#    - Chrome
#    - Firefox
#    - Safari
```

---

## 🌐 Despliegue a Producción

### Variables de Entorno

Asegúrate de que estas variables estén configuradas:

**Local (.env):**
```bash
VITE_APP_URL=http://localhost:8080
```

**Vercel (Preview):**
```bash
VITE_APP_URL=https://reserveo.vercel.app
```

**Producción (VPS):**
```bash
VITE_APP_URL=https://www.reserveo.app
```

### Desplegar

```bash
# 1. Commit de cambios
git add public/*.png public/*.ico index.html supabase/functions/send-notification/index.ts
git commit -m "feat: implement new Reserveo logo for web and emails"

# 2. Push a repositorio
git push origin main

# 3. Vercel desplegará automáticamente
# O manualmente:
vercel --prod

# 4. Verificar en producción
curl -I https://www.reserveo.app/favicon.ico
curl -I https://www.reserveo.app/logo-email.png
```

---

## ✅ Checklist de Verificación

### Favicon Web
- [ ] `favicon.ico` existe en `public/`
- [ ] `favicon.png` (32x32) existe en `public/`
- [ ] `apple-touch-icon.png` (180x180) existe en `public/`
- [ ] `index.html` tiene referencias correctas
- [ ] Favicon se ve en pestaña del navegador (local)
- [ ] Favicon se ve en pestaña del navegador (producción)

### Logo en Emails
- [ ] `logo-email.png` (64x64) existe en `public/`
- [ ] Peso de `logo-email.png` < 10KB
- [ ] Edge Function usa `logoUrl` variable
- [ ] Variable `VITE_APP_URL` configurada en Vercel
- [ ] Email de prueba enviado
- [ ] Logo se ve en Gmail
- [ ] Logo se ve en Outlook
- [ ] Logo se ve en Apple Mail

### Open Graph / Social
- [ ] `index.html` usa `/logo_reserveo.png` en meta tags
- [ ] Logo se ve al compartir en Facebook
- [ ] Logo se ve al compartir en Twitter
- [ ] Logo se ve al compartir en LinkedIn

---

## 🐛 Troubleshooting

### Favicon no se ve

**Causa:** Cache del navegador

**Solución:**
```bash
# 1. Limpiar cache del navegador
# Chrome: Ctrl+Shift+Delete → Imágenes en caché

# 2. Hard refresh
# Chrome: Ctrl+Shift+R
# Firefox: Ctrl+F5
# Safari: Cmd+Option+R

# 3. Verificar que archivo existe
curl -I http://localhost:8080/favicon.ico
```

### Logo no se ve en emails

**Causa:** URL incorrecta o archivo no accesible

**Solución:**
```bash
# 1. Verificar variable de entorno
echo $VITE_APP_URL

# 2. Verificar que logo es accesible
curl -I https://www.reserveo.app/logo-email.png
# Debe retornar: HTTP/2 200

# 3. Verificar peso del archivo
ls -lh public/logo-email.png
# Debe ser < 10KB
```

### Logo pixelado en emails

**Causa:** Resolución baja o compresión excesiva

**Solución:**
```bash
# Regenerar logo-email.png con mejor calidad
node scripts/generate-favicons-with-sharp.js

# O usar logo original si es pequeño
cp public/logo_reserveo.png public/logo-email.png
```

---

## 📊 Tamaños Recomendados

| Archivo | Tamaño | Peso | Uso |
|---------|--------|------|-----|
| `favicon.ico` | 16x16, 32x32, 48x48 | < 5KB | Favicon navegador |
| `favicon.png` | 32x32 | < 3KB | Favicon alternativo |
| `apple-touch-icon.png` | 180x180 | < 15KB | iOS home screen |
| `logo-email.png` | 64x64 | < 10KB | Emails |
| `logo_reserveo.png` | Original | Variable | Open Graph, fuente |

---

## 🎯 Próximos Pasos

1. **Generar favicons** usando una de las opciones (A o B)
2. **Verificar localmente** que todo funciona
3. **Desplegar a producción**
4. **Probar emails** con el nuevo logo
5. **Verificar en redes sociales** (compartir link)

---

## 📚 Referencias

- [Real Favicon Generator](https://realfavicongenerator.net/)
- [ICO Converter](https://www.icoconverter.com/)
- [TinyPNG](https://tinypng.com/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

---

**Tiempo estimado:** 15-20 minutos  
**Resultado:** Logo nuevo implementado en web y emails ✨
