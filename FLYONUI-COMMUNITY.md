# 🎨 FlyonUI Community - Instalación Completa

## ✅ Estado: INSTALADO

FlyonUI Community (versión gratuita y open source) está completamente instalado y listo para usar en RESERVEO.

---

## 📦 ¿Qué es FlyonUI Community?

**FlyonUI** es una biblioteca de componentes Tailwind CSS **completamente gratuita** y open source que combina:
- Clases semánticas fáciles de usar
- Plugins JavaScript robustos
- 80+ componentes UI interactivos
- Compatible con cualquier framework (React, Vue, Svelte, etc.)

**Licencia:** MIT (gratis para siempre)  
**GitHub:** https://github.com/themeselection/flyonui  
**Documentación:** https://flyonui.com/

---

## ✅ Instalación Completada

### 1. Paquete instalado
```bash
✅ npm install -D flyonui@latest
```

### 2. Tailwind configurado
Archivo: `tailwind.config.ts`

```typescript
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/flyonui/dist/js/*.js"  // ✅ Añadido
  ],
  plugins: [
    require("tailwindcss-animate"),
    require("flyonui")           // ✅ Añadido
  ],
} satisfies Config;
```

### 3. JavaScript importado
Archivo: `src/main.tsx`

```typescript
import "flyonui/flyonui";  // ✅ Añadido
```

---

## 🎯 Componentes Disponibles

FlyonUI incluye 80+ componentes interactivos:

### Navegación
- **Navbar** - Barras de navegación responsive
- **Breadcrumb** - Migas de pan
- **Tabs** - Pestañas
- **Pagination** - Paginación
- **Steps** - Indicadores de pasos

### Formularios
- **Input** - Campos de texto mejorados
- **Select** - Selectores estilizados
- **Checkbox** - Checkboxes personalizados
- **Radio** - Radio buttons
- **Toggle** - Interruptores
- **Range** - Sliders
- **File Input** - Subida de archivos

### Contenido
- **Card** - Tarjetas
- **Badge** - Insignias
- **Alert** - Alertas
- **Avatar** - Avatares
- **Stat** - Estadísticas
- **Timeline** - Líneas de tiempo
- **Table** - Tablas mejoradas

### Overlays
- **Modal** - Modales/Diálogos
- **Drawer** - Cajones laterales
- **Dropdown** - Menús desplegables
- **Tooltip** - Tooltips
- **Popover** - Popovers

### Feedback
- **Loading** - Indicadores de carga
- **Progress** - Barras de progreso
- **Skeleton** - Skeletons de carga
- **Toast** - Notificaciones

### Y muchos más...

---

## 🚀 Cómo Usar FlyonUI

### Opción 1: Clases Semánticas (Recomendado)

FlyonUI usa clases semánticas fáciles de recordar:

```tsx
// Botón primario
<button className="btn btn-primary">
  Click me
</button>

// Card con contenido
<div className="card">
  <div className="card-body">
    <h2 className="card-title">Título</h2>
    <p>Contenido de la tarjeta</p>
  </div>
</div>

// Input con label
<label className="form-control">
  <span className="label-text">Email</span>
  <input type="email" className="input" placeholder="tu@email.com" />
</label>

// Modal
<dialog className="modal">
  <div className="modal-box">
    <h3 className="modal-title">Título del Modal</h3>
    <p>Contenido del modal</p>
    <div className="modal-action">
      <button className="btn">Cerrar</button>
    </div>
  </div>
</dialog>
```

### Opción 2: Componentes JavaScript Interactivos

Algunos componentes tienen funcionalidad JavaScript automática:

```tsx
// Dropdown (se abre/cierra automáticamente)
<div className="dropdown">
  <button className="btn">
    Abrir menú
  </button>
  <ul className="dropdown-menu">
    <li><a>Opción 1</a></li>
    <li><a>Opción 2</a></li>
  </ul>
</div>

// Accordion
<div className="accordion">
  <div className="accordion-item">
    <button className="accordion-toggle">
      Pregunta 1
    </button>
    <div className="accordion-content">
      Respuesta 1
    </div>
  </div>
</div>

// Tabs
<div className="tabs">
  <button className="tab tab-active">Tab 1</button>
  <button className="tab">Tab 2</button>
  <button className="tab">Tab 3</button>
</div>
```

---

## 💡 Ejemplos para RESERVEO

### Dashboard Stats Card

```tsx
<div className="stats shadow">
  <div className="stat">
    <div className="stat-figure text-primary">
      <svg className="w-8 h-8">...</svg>
    </div>
    <div className="stat-title">Total Plazas</div>
    <div className="stat-value text-primary">150</div>
    <div className="stat-desc">En 3 grupos</div>
  </div>
  
  <div className="stat">
    <div className="stat-figure text-success">
      <svg className="w-8 h-8">...</svg>
    </div>
    <div className="stat-title">Disponibles Hoy</div>
    <div className="stat-value text-success">45</div>
    <div className="stat-desc">30% disponibilidad</div>
  </div>
</div>
```

### Alert de Confirmación

```tsx
<div className="alert alert-success">
  <svg className="w-6 h-6">...</svg>
  <span>Reserva creada exitosamente</span>
</div>

<div className="alert alert-error">
  <svg className="w-6 h-6">...</svg>
  <span>Error al crear la reserva</span>
</div>
```

### Modal de Confirmación

```tsx
<dialog id="confirm-modal" className="modal">
  <div className="modal-box">
    <h3 className="modal-title">¿Confirmar reserva?</h3>
    <p className="py-4">
      ¿Estás seguro de que quieres reservar la plaza A-15 para el 15/01/2025?
    </p>
    <div className="modal-action">
      <button className="btn btn-ghost">Cancelar</button>
      <button className="btn btn-primary">Confirmar</button>
    </div>
  </div>
</dialog>
```

### Tabla de Reservas

```tsx
<div className="overflow-x-auto">
  <table className="table">
    <thead>
      <tr>
        <th>Plaza</th>
        <th>Usuario</th>
        <th>Fecha</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>A-15</td>
        <td>Juan Pérez</td>
        <td>15/01/2025</td>
        <td><span className="badge badge-success">Activa</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

### Loading Skeleton

```tsx
<div className="card">
  <div className="card-body">
    <div className="skeleton h-4 w-28 mb-4"></div>
    <div className="skeleton h-32 w-full mb-4"></div>
    <div className="skeleton h-4 w-full mb-2"></div>
    <div className="skeleton h-4 w-3/4"></div>
  </div>
</div>
```

---

## 🎨 Temas y Personalización

FlyonUI soporta múltiples temas. Puedes configurarlos en `tailwind.config.ts`:

```typescript
export default {
  // ... resto de config
  flyonui: {
    themes: [
      "light",
      "dark",
      "gourmet",
      "corporate",
      "luxury",
      "soft"
    ]
  }
} satisfies Config;
```

Para cambiar el tema en runtime:

```tsx
// Cambiar a tema oscuro
document.documentElement.setAttribute('data-theme', 'dark');

// Cambiar a tema claro
document.documentElement.setAttribute('data-theme', 'light');
```

---

## 📚 Recursos

### Documentación Oficial
- **Inicio:** https://flyonui.com/
- **Componentes:** https://flyonui.com/components/
- **Guía de instalación:** https://flyonui.com/docs/getting-started/quick-start/
- **Ejemplos:** https://flyonui.com/components/

### GitHub
- **Repositorio:** https://github.com/themeselection/flyonui
- **Issues:** https://github.com/themeselection/flyonui/issues
- **Contribuir:** https://github.com/themeselection/flyonui/blob/main/CONTRIBUTING.md

### Comunidad
- **Discord:** https://discord.com/invite/kBHkY7DekX
- **Twitter:** https://twitter.com/themeselection

---

## 🆚 FlyonUI vs shadcn/ui

Ambos están instalados en RESERVEO. ¿Cuándo usar cada uno?

### Usa FlyonUI cuando:
- ✅ Necesitas componentes con clases semánticas simples
- ✅ Quieres componentes JavaScript interactivos listos
- ✅ Prefieres menos código boilerplate
- ✅ Necesitas temas predefinidos

### Usa shadcn/ui cuando:
- ✅ Necesitas componentes altamente customizables
- ✅ Quieres control total del código
- ✅ Prefieres componentes basados en Radix UI
- ✅ Necesitas accesibilidad avanzada

**Recomendación:** Puedes usar ambos en el mismo proyecto. FlyonUI para componentes simples y rápidos, shadcn/ui para componentes complejos y customizados.

---

## 🔧 Troubleshooting

### Los estilos no se aplican
1. Verifica que el plugin está en `tailwind.config.ts`
2. Reinicia el servidor de desarrollo: `npm run dev`
3. Limpia la caché de Tailwind

### Los componentes JavaScript no funcionan
1. Verifica que importaste `flyonui/flyonui` en `main.tsx`
2. Revisa la consola del navegador por errores
3. Asegúrate de usar las clases correctas

### Conflictos con shadcn/ui
- FlyonUI y shadcn/ui pueden coexistir
- Usa prefijos diferentes si hay conflictos
- Prioriza uno sobre otro según el componente

---

## 🧪 Componente de Ejemplo

Hemos creado un componente de ejemplo en `src/components/FlyonUIExample.tsx` que muestra:

- ✅ Botones (primary, secondary, success, error, etc.)
- ✅ Cards con acciones
- ✅ Alerts (info, success, warning, error)
- ✅ Stats (estadísticas)
- ✅ Badges
- ✅ Form controls (input, textarea, select, checkbox)
- ✅ Progress bars
- ✅ Loading spinners
- ✅ Skeletons

**Para ver el ejemplo:**

1. Importa el componente en cualquier página:
   ```tsx
   import { FlyonUIExample } from '@/components/FlyonUIExample';
   ```

2. Úsalo en tu JSX:
   ```tsx
   <FlyonUIExample />
   ```

3. Inspecciona el código fuente para ver cómo usar cada componente

---

## ✨ Próximos Pasos

1. **Explora los componentes:** https://flyonui.com/components/
2. **Prueba el ejemplo** en `src/components/FlyonUIExample.tsx`
3. **Personaliza temas** según tu diseño
4. **Combina con shadcn/ui** para máxima flexibilidad

---

## 🎉 ¡Listo para usar!

FlyonUI Community está completamente instalado y configurado. Puedes empezar a usar sus componentes inmediatamente con clases semánticas simples.

**Ejemplo rápido:**
```tsx
<button className="btn btn-primary">
  ¡Funciona! 🚀
</button>
```
