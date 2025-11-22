# PWA Setup - RESERVEO

## ✅ Implementación Completada

La PWA (Progressive Web App) de RESERVEO está completamente configurada y lista para usar.

## 🎯 Problema Resuelto

**Antes:**
- Usuario instalaba la PWA → Siempre abría en `/` (landing page)
- Tenía que hacer clic en "Solicitar Demo" cada vez
- Si estaba logado, tenía que navegar manualmente

**Ahora:**
- Usuario instala la PWA → Abre directamente en `/dashboard`
- Si está logado → Ve su dashboard inmediatamente
- Si no está logado → Redirige automáticamente a `/auth`
- Experiencia nativa de app móvil

## 📱 Características Implementadas

### 1. Manifest.json
- **Start URL**: `/dashboard` (la app siempre abre aquí)
- **Display**: `standalone` (sin barra de navegador)
- **Theme Color**: `#6366f1` (color de marca)
- **Icons**: Múltiples tamaños para diferentes dispositivos
- **Shortcuts**: Accesos rápidos a Dashboard, Reservar, Waitlist, Perfil

### 2. Service Worker (sw.js)
- **Caché de recursos críticos**: Landing, Dashboard, Auth, Assets
- **Estrategia Network First**: Siempre intenta red primero, fallback a caché
- **Offline support**: Funciona sin conexión con datos cacheados
- **Auto-actualización**: Verifica nuevas versiones cada hora

### 3. Protección de Rutas
- **Dashboard**: Redirige a `/auth` si no hay sesión
- **Auth**: Redirige a `/dashboard` si ya hay sesión
- **Persistencia**: Sesión guardada en localStorage

### 4. PWA Install Prompt
- **Banner inteligente**: Solo se muestra si la app no está instalada
- **Dismissible**: Usuario puede rechazar y no volver a ver
- **Auto-hide**: Se oculta después de instalar

### 5. PWA Utils
- Detección de PWA instalada
- Detección de dispositivo móvil
- Detección de iOS/Android
- Logging para debugging

## 🚀 Cómo Probar

### En Desarrollo Local

1. **Iniciar servidor**:
   ```bash
   npm run dev
   ```

2. **Abrir en navegador móvil**:
   - Opción A: Usar DevTools de Chrome (F12) → Toggle device toolbar
   - Opción B: Acceder desde móvil real a tu IP local (ej: `http://192.168.1.100:8080`)

3. **Instalar PWA**:
   - **Chrome Android**: Menú → "Añadir a pantalla de inicio"
   - **Safari iOS**: Compartir → "Añadir a pantalla de inicio"

4. **Verificar comportamiento**:
   - Abrir la app instalada
   - Debería abrir directamente en `/dashboard`
   - Si no estás logado, redirige a `/auth`
   - Si estás logado, ves el dashboard

### En Vercel (Preview/Production)

1. **Acceder desde móvil**:
   ```
   https://reserveo.vercel.app
   ```

2. **Instalar PWA** (mismo proceso que arriba)

3. **Verificar**:
   - La app abre en `/dashboard`
   - Sesión persiste entre aperturas
   - Funciona offline (con datos cacheados)

## 🔍 Debugging

### Ver logs de PWA

Abre la consola del navegador y busca:

```
[PWA Info] {
  Running as PWA: true/false,
  Mobile Device: true/false,
  iOS: true/false,
  Android: true/false,
  Can Install: true/false,
  Display Mode: 'standalone' | 'browser'
}
```

### Verificar Service Worker

1. Chrome DevTools → Application → Service Workers
2. Verificar que `sw.js` está registrado y activo
3. Ver caché en Application → Cache Storage

### Verificar Manifest

1. Chrome DevTools → Application → Manifest
2. Verificar que `start_url` es `/dashboard`
3. Verificar iconos y configuración

## 📋 Checklist de Funcionalidad

- [x] Manifest.json configurado con start_url=/dashboard
- [x] Service Worker registrado y funcionando
- [x] Protección de rutas en Dashboard
- [x] Persistencia de sesión (localStorage)
- [x] PWA Install Prompt
- [x] Detección de PWA instalada
- [x] Offline support básico
- [x] Auto-actualización de Service Worker
- [x] Shortcuts de app
- [x] Meta tags de PWA en index.html

## 🎨 Experiencia de Usuario

### Primera Vez (Usuario Nuevo)

1. Entra a `reserveo.vercel.app` desde navegador móvil
2. Ve la landing page
3. Ve banner de "Instalar RESERVEO"
4. Hace clic en "Instalar"
5. App se añade a pantalla de inicio
6. Abre la app → Va a `/dashboard`
7. No está logado → Redirige a `/auth`
8. Se registra/loguea
9. Va a `/dashboard` automáticamente

### Usuario Existente (Ya Logado)

1. Abre la app instalada
2. Va directamente a `/dashboard`
3. Ve sus reservas inmediatamente
4. No necesita hacer login de nuevo

### Usuario Existente (Sesión Expirada)

1. Abre la app instalada
2. Va a `/dashboard`
3. No hay sesión → Redirige a `/auth`
4. Hace login
5. Va a `/dashboard`

## 🔧 Configuración Técnica

### Manifest.json

```json
{
  "start_url": "/dashboard",  // ← Clave: abre aquí
  "display": "standalone",     // Sin barra de navegador
  "scope": "/",                // Toda la app
  "orientation": "portrait-primary"
}
```

### Service Worker

```javascript
// Caché de recursos críticos
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/auth',
  '/manifest.json',
  // ... assets
];

// Estrategia: Network First
fetch(request)
  .then(response => {
    // Guardar en caché
    cache.put(request, response.clone());
    return response;
  })
  .catch(() => {
    // Fallback a caché
    return cache.match(request);
  });
```

### Protección de Rutas

```typescript
// useDashboardAuth.ts
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      navigate("/auth");  // ← Redirige si no hay sesión
    }
  });
}, []);
```

## 📱 Compatibilidad

### Navegadores Soportados

- ✅ Chrome Android 80+
- ✅ Safari iOS 11.3+
- ✅ Firefox Android 68+
- ✅ Samsung Internet 10+
- ✅ Edge Android 80+

### Funcionalidades por Plataforma

| Funcionalidad | Chrome Android | Safari iOS | Firefox Android |
|---------------|----------------|------------|-----------------|
| Install Prompt | ✅ | ⚠️ Manual | ✅ |
| Service Worker | ✅ | ✅ | ✅ |
| Offline Support | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ❌ | ✅ |
| Shortcuts | ✅ | ❌ | ✅ |

**Nota iOS**: Safari no soporta install prompt automático ni shortcuts. Los usuarios deben añadir manualmente desde Compartir → "Añadir a pantalla de inicio".

## 🚨 Troubleshooting

### La app no se instala

**Posibles causas:**
1. No estás en HTTPS (requerido para PWA)
2. Manifest.json no se carga correctamente
3. Service Worker no está registrado

**Solución:**
1. Verificar que estás en `https://` (no `http://`)
2. Abrir DevTools → Application → Manifest
3. Verificar Service Worker en Application → Service Workers

### La app abre en landing en vez de dashboard

**Posibles causas:**
1. Manifest.json no tiene `start_url: "/dashboard"`
2. Caché antigua del navegador

**Solución:**
1. Verificar manifest.json
2. Desinstalar app y reinstalar
3. Limpiar caché del navegador

### La sesión no persiste

**Posibles causas:**
1. localStorage bloqueado
2. Modo incógnito
3. Configuración de privacidad del navegador

**Solución:**
1. Verificar que localStorage está habilitado
2. No usar modo incógnito
3. Permitir cookies y almacenamiento local

### Offline no funciona

**Posibles causas:**
1. Service Worker no está activo
2. Recursos no están en caché
3. Primera vez sin conexión (no hay caché)

**Solución:**
1. Verificar Service Worker activo
2. Abrir la app al menos una vez con conexión
3. Verificar caché en DevTools

## 📚 Referencias

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Add to Home Screen](https://web.dev/customize-install/)

## 🎉 Resultado Final

**Antes**: 5 pasos para llegar al dashboard  
**Ahora**: 1 paso (abrir la app)

**Antes**: Login cada vez que abres  
**Ahora**: Sesión persistente

**Antes**: Parece una web  
**Ahora**: Parece una app nativa

✅ **PWA completamente funcional y lista para producción**
