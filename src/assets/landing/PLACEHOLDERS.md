# Placeholders Temporales para Screenshots

## Estado Actual

Los siguientes screenshots están usando placeholders temporales y deben ser reemplazados con capturas reales de la aplicación:

### Screenshots Pendientes

1. **dashboard-screenshot.png** (1200x800px)
   - Placeholder: `https://placehold.co/1200x800/1a1a1a/ffffff?text=Dashboard+Screenshot`
   - Capturar: Vista principal del dashboard de usuario con reserva activa

2. **calendar-screenshot.png** (1200x800px)
   - Placeholder: `https://placehold.co/1200x800/1a1a1a/ffffff?text=Calendar+Screenshot`
   - Capturar: Calendario mensual con disponibilidad

3. **checkin-screenshot.png** (800x600px)
   - Placeholder: `https://placehold.co/800x600/1a1a1a/ffffff?text=Check-in+Screenshot`
   - Capturar: Card de check-in en dashboard

4. **waitlist-screenshot.png** (1200x800px)
   - Placeholder: `https://placehold.co/1200x800/1a1a1a/ffffff?text=Waitlist+Screenshot`
   - Capturar: Dashboard de lista de espera

5. **incidents-screenshot.png** (800x1200px)
   - Placeholder: `https://placehold.co/800x1200/1a1a1a/ffffff?text=Incidents+Screenshot`
   - Capturar: Flujo de reporte de incidente (móvil)

6. **notifications-screenshot.png** (600x800px)
   - Placeholder: `https://placehold.co/600x800/1a1a1a/ffffff?text=Notifications+Screenshot`
   - Capturar: Panel de notificaciones

7. **warnings-screenshot.png** (1200x800px)
   - Placeholder: `https://placehold.co/1200x800/1a1a1a/ffffff?text=Warnings+Screenshot`
   - Capturar: Perfil con advertencias

8. **offline-screenshot.png** (1200x600px)
   - Placeholder: `https://placehold.co/1200x600/1a1a1a/ffffff?text=Offline+Screenshot`
   - Capturar: Indicador de modo offline

9. **admin-screenshot.png** (1400x900px)
   - Placeholder: `https://placehold.co/1400x900/1a1a1a/ffffff?text=Admin+Screenshot`
   - Capturar: Panel de administración con editor visual

## Cómo Capturar Screenshots

### Preparación
1. Iniciar la aplicación: `npm run dev`
2. Navegar a la sección correspondiente
3. Asegurar que hay datos de ejemplo visibles
4. Usar modo oscuro para consistencia visual

### Herramientas
- **macOS**: Cmd+Shift+4 (selección) o Cmd+Shift+5 (opciones)
- **Windows**: Win+Shift+S
- **Chrome DevTools**: Cmd+Shift+P → "Capture screenshot"

### Optimización
```bash
# Convertir a WebP (mejor compresión)
cwebp -q 80 screenshot.png -o screenshot.webp

# O usar herramienta online
# https://squoosh.app/
```

## Actualizar Rutas

Una vez capturados los screenshots reales, actualizar las rutas en `src/data/landingContent.ts`:

```typescript
solutions: [
  {
    id: "reservations",
    imageUrl: "/assets/landing/calendar-screenshot.png", // ← Actualizar
    // ...
  },
  // ...
]
```

## Checklist

- [ ] Capturar dashboard-screenshot.png
- [ ] Capturar calendar-screenshot.png
- [ ] Capturar checkin-screenshot.png
- [ ] Capturar waitlist-screenshot.png
- [ ] Capturar incidents-screenshot.png
- [ ] Capturar notifications-screenshot.png
- [ ] Capturar warnings-screenshot.png
- [ ] Capturar offline-screenshot.png
- [ ] Capturar admin-screenshot.png
- [ ] Optimizar todas las imágenes
- [ ] Actualizar rutas en landingContent.ts
- [ ] Eliminar este archivo PLACEHOLDERS.md
