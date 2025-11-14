---
inclusion: always
---

# RESERVEO - MCP Servers Available

## Siempre háblame en español

## Overview

Este proyecto tiene configurados varios MCP (Model Context Protocol) servers que proporcionan herramientas especializadas para diferentes tareas.

## 1. Supabase MCP Server

**Servidor:** `mcp_supabase_reserveo`  
**Propósito:** Interacción directa con la base de datos de Supabase  
**Proyecto:** `rlrzcfnhhvrvrxzfifeh` (Reserveo)

### Herramientas Disponibles

#### `supabase_query`
Ejecuta queries SELECT en la base de datos (solo lectura por seguridad).

```typescript
mcp_supabase_reserveo_supabase_query({
  query: "SELECT * FROM profiles WHERE is_blocked = false LIMIT 10"
})
```

**Uso recomendado:**
- Inspeccionar datos antes de hacer cambios
- Verificar estado de registros
- Debugging de problemas
- Análisis de datos

**Limitaciones:**
- Solo SELECT (no INSERT/UPDATE/DELETE)
- Respeta las políticas RLS del usuario autenticado

#### `supabase_list_tables`
Lista todas las tablas en el schema público.

```typescript
mcp_supabase_reserveo_supabase_list_tables()
```

**Retorna:**
- Nombres de todas las tablas
- Útil para explorar la estructura de la BD

#### `supabase_describe_table`
Obtiene información detallada de una tabla específica.

```typescript
mcp_supabase_reserveo_supabase_describe_table({
  tableName: "reservations"
})
```

**Retorna:**
- Columnas y sus tipos
- Constraints (PK, FK, UNIQUE, CHECK)
- Índices
- Valores por defecto

**Uso recomendado:**
- Antes de crear migraciones
- Verificar estructura de tabla
- Entender relaciones entre tablas

#### `supabase_list_migrations`
Lista todos los archivos de migración en `supabase/migrations/`.

```typescript
mcp_supabase_reserveo_supabase_list_migrations()
```

**Retorna:**
- Nombres de archivos de migración
- Ordenados cronológicamente

#### `supabase_read_migration`
Lee el contenido de un archivo de migración específico.

```typescript
mcp_supabase_reserveo_supabase_read_migration({
  filename: "20251111234017_add_incident_reporting_features.sql"
})
```

**Uso recomendado:**
- Revisar migraciones anteriores
- Entender cambios de schema
- Copiar patrones de migraciones exitosas

#### `supabase_get_project_info`
Obtiene información del proyecto de Supabase.

```typescript
mcp_supabase_reserveo_supabase_get_project_info()
```

**Retorna:**
- Project ID
- URL del proyecto
- Región
- Estado

#### `supabase_cli_status`
Verifica el estado del CLI de Supabase y servicios locales.

```typescript
mcp_supabase_reserveo_supabase_cli_status()
```

**Nota:** Este proyecto NO usa Docker local, trabaja directamente con la BD remota.

#### `supabase_cli_command`
Ejecuta comandos del CLI de Supabase.

```typescript
mcp_supabase_reserveo_supabase_cli_command({
  command: "migration list"
})
```

**Comandos útiles:**
- `migration list` - Ver migraciones aplicadas
- `gen types typescript --linked` - Regenerar tipos
- `db push` - Aplicar migraciones pendientes

**⚠️ Usar con precaución:** Algunos comandos modifican la BD.

#### `supabase_count_records`
Cuenta registros en una tabla con filtros opcionales.

```typescript
mcp_supabase_reserveo_supabase_count_records({
  tableName: "reservations",
  filters: { status: "active" }
})
```

**Uso recomendado:**
- Verificar cantidad de registros
- Estadísticas rápidas
- Validar resultados de operaciones

#### `supabase_get_rls_policies`
Obtiene las políticas de Row Level Security de una tabla.

```typescript
mcp_supabase_reserveo_supabase_get_rls_policies({
  tableName: "incident_reports"
})
```

**Retorna:**
- Nombre de la política
- Comando (SELECT, INSERT, UPDATE, DELETE)
- Rol (authenticated, anon)
- Expresión USING
- Expresión WITH CHECK

**Uso recomendado:**
- Verificar seguridad de tablas
- Debugging de problemas de permisos
- Antes de crear nuevas políticas

## 2. Fetch MCP Server

**Servidor:** `mcp_fetch`  
**Propósito:** Obtener contenido de URLs de internet

### Herramientas Disponibles

#### `fetch`
Obtiene contenido de una URL y lo convierte a markdown.

```typescript
mcp_fetch_fetch({
  url: "https://example.com/api/docs",
  max_length: 5000,
  start_index: 0,
  raw: false
})
```

**Parámetros:**
- `url` (requerido) - URL a obtener
- `max_length` (opcional) - Máximo de caracteres (default: 5000)
- `start_index` (opcional) - Índice de inicio (default: 0)
- `raw` (opcional) - Obtener HTML sin simplificar (default: false)

**Uso recomendado:**
- Consultar documentación externa
- Obtener información actualizada
- Verificar APIs públicas

## 3. Memory MCP Server

**Servidor:** `mcp_memory`  
**Propósito:** Gestión de knowledge graph para recordar información entre sesiones

### Herramientas Disponibles

#### `create_entities`
Crea nuevas entidades en el knowledge graph.

```typescript
mcp_memory_create_entities({
  entities: [
    {
      name: "Usuario Juan",
      entityType: "user",
      observations: [
        "Tiene 3 advertencias por ocupar plazas",
        "Matrícula: 1234ABC"
      ]
    }
  ]
})
```

**Uso recomendado:**
- Recordar información importante del proyecto
- Guardar decisiones de diseño
- Documentar problemas recurrentes

#### `create_relations`
Crea relaciones entre entidades.

```typescript
mcp_memory_create_relations({
  relations: [
    {
      from: "Usuario Juan",
      to: "Plaza A-15",
      relationType: "ocupa_frecuentemente"
    }
  ]
})
```

#### `add_observations`
Añade observaciones a entidades existentes.

```typescript
mcp_memory_add_observations({
  observations: [
    {
      entityName: "Usuario Juan",
      contents: ["Recibió advertencia el 2025-11-12"]
    }
  ]
})
```

#### `delete_entities`
Elimina entidades del knowledge graph.

```typescript
mcp_memory_delete_entities({
  entityNames: ["Usuario Juan"]
})
```

#### `delete_observations`
Elimina observaciones específicas.

```typescript
mcp_memory_delete_observations({
  deletions: [
    {
      entityName: "Usuario Juan",
      observations: ["Observación obsoleta"]
    }
  ]
})
```

#### `delete_relations`
Elimina relaciones entre entidades.

```typescript
mcp_memory_delete_relations({
  relations: [
    {
      from: "Usuario Juan",
      to: "Plaza A-15",
      relationType: "ocupa_frecuentemente"
    }
  ]
})
```

#### `read_graph`
Lee todo el knowledge graph.

```typescript
mcp_memory_read_graph()
```

**Retorna:** Todas las entidades, relaciones y observaciones.

#### `search_nodes`
Busca nodos en el knowledge graph.

```typescript
mcp_memory_search_nodes({
  query: "advertencias"
})
```

**Uso recomendado:**
- Buscar información guardada previamente
- Recuperar contexto de conversaciones anteriores

#### `open_nodes`
Abre nodos específicos por nombre.

```typescript
mcp_memory_open_nodes({
  names: ["Usuario Juan", "Plaza A-15"]
})
```

## 4. Brave Search MCP Server

**Servidor:** `mcp_brave_search`  
**Propósito:** Búsquedas en internet (web y locales)

### Herramientas Disponibles

#### `brave_web_search`
Búsqueda web general usando Brave Search API.

```typescript
mcp_brave_search_brave_web_search({
  query: "Supabase Row Level Security best practices",
  count: 10,
  offset: 0
})
```

**Parámetros:**
- `query` (requerido) - Búsqueda (max 400 chars)
- `count` (opcional) - Número de resultados (1-20, default: 10)
- `offset` (opcional) - Paginación (max 9, default: 0)

**Uso recomendado:**
- Buscar documentación actualizada
- Resolver errores específicos
- Investigar mejores prácticas

#### `brave_local_search`
Búsqueda de negocios y lugares locales.

```typescript
mcp_brave_search_brave_local_search({
  query: "parking management software near Madrid",
  count: 5
})
```

**Retorna:**
- Nombres de negocios
- Direcciones
- Ratings y reviews
- Teléfonos y horarios

**Uso recomendado:**
- Buscar servicios locales
- Investigar competencia
- Encontrar proveedores

## 5. shadcn MCP Server

**Servidor:** `mcp_shadcn`  
**Propósito:** Explorar, buscar e instalar componentes de registries de shadcn/ui

### Herramientas Disponibles

#### `get_project_registries`
Obtiene los registries configurados en `components.json`.

```typescript
mcp_shadcn_get_project_registries()
```

**Retorna:**
- Lista de registries configurados
- URLs de cada registry

**Uso recomendado:**
- Verificar qué registries están disponibles
- Confirmar configuración antes de buscar componentes

#### `list_items_in_registries`
Lista items disponibles en los registries especificados.

```typescript
mcp_shadcn_list_items_in_registries({
  registries: ["@shadcn"],
  limit: 50,
  offset: 0
})
```

**Parámetros:**
- `registries` (requerido) - Array de nombres de registry (ej: `["@shadcn", "@acme"]`)
- `limit` (opcional) - Máximo de items a retornar
- `offset` (opcional) - Número de items a saltar (paginación)

**Retorna:**
- Nombres de componentes
- Descripciones
- Tipos (component, hook, lib, etc.)

**Uso recomendado:**
- Explorar componentes disponibles
- Ver catálogo completo de un registry

#### `search_items_in_registries`
Busca componentes usando fuzzy matching.

```typescript
mcp_shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "button",
  limit: 10,
  offset: 0
})
```

**Parámetros:**
- `registries` (requerido) - Array de registries donde buscar
- `query` (requerido) - Término de búsqueda
- `limit` (opcional) - Máximo de resultados
- `offset` (opcional) - Paginación

**Retorna:**
- Componentes que coinciden con la búsqueda
- Ordenados por relevancia

**Uso recomendado:**
- Encontrar componentes específicos
- Buscar por funcionalidad ("table", "form", "dialog")
- Explorar componentes relacionados

**Nota:** Después de encontrar un item, usa `get_item_examples_from_registries` para ver ejemplos de uso.

#### `view_items_in_registries`
Ver información detallada de items específicos.

```typescript
mcp_shadcn_view_items_in_registries({
  items: ["@shadcn/button", "@shadcn/card"]
})
```

**Parámetros:**
- `items` (requerido) - Array de items con prefijo de registry (ej: `["@shadcn/button"]`)

**Retorna:**
- Nombre y descripción
- Tipo de item
- Contenido de archivos
- Dependencias

**Uso recomendado:**
- Inspeccionar código antes de instalar
- Verificar dependencias
- Entender implementación

**Nota:** Para ver ejemplos de uso, usa `get_item_examples_from_registries` en su lugar.

#### `get_item_examples_from_registries`
Encuentra ejemplos de uso y demos con código completo.

```typescript
mcp_shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "button-demo"
})
```

**Parámetros:**
- `registries` (requerido) - Array de registries
- `query` (requerido) - Búsqueda de ejemplos (ej: "accordion-demo", "button example", "card-demo")

**Patrones comunes:**
- `{item-name}-demo` (ej: "button-demo", "card-demo")
- `{item-name} example` (ej: "button example")
- `example-{item-name}` (ej: "example-booking-form")

**Retorna:**
- Código completo de implementación
- Dependencias necesarias
- Ejemplos funcionales

**Uso recomendado:**
- Ver cómo usar un componente
- Copiar patrones de implementación
- Entender casos de uso

#### `get_add_command_for_items`
Obtiene el comando CLI para añadir componentes.

```typescript
mcp_shadcn_get_add_command_for_items({
  items: ["@shadcn/button", "@shadcn/card"]
})
```

**Parámetros:**
- `items` (requerido) - Array de items con prefijo de registry

**Retorna:**
- Comando `shadcn add` listo para ejecutar
- Incluye todos los items especificados

**Uso recomendado:**
- Obtener comando para instalar múltiples componentes
- Verificar sintaxis correcta antes de instalar

#### `get_audit_checklist`
Obtiene checklist de verificación después de crear componentes.

```typescript
mcp_shadcn_get_audit_checklist()
```

**Retorna:**
- Lista de verificación
- Pasos para confirmar que todo funciona

**Uso recomendado:**
- Después de generar nuevos componentes
- Después de instalar componentes de registries
- Verificar que la instalación fue exitosa

### Configuración de Registries

El MCP de shadcn lee la configuración de `components.json`:

```json
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json",
    "@acme": "https://acme.com/r/{name}.json",
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

**Registries privados:**
- Configurar headers de autenticación
- Usar variables de entorno en `.env.local`
- Ejemplo: `REGISTRY_TOKEN=your_token_here`

### Ejemplos de Uso

**Explorar componentes disponibles:**
```typescript
// Ver todos los componentes de shadcn
mcp_shadcn_list_items_in_registries({
  registries: ["@shadcn"],
  limit: 50
})
```

**Buscar componente específico:**
```typescript
// Buscar componentes de tabla
mcp_shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "table"
})
```

**Ver ejemplo de uso:**
```typescript
// Ver demo de accordion
mcp_shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "accordion-demo"
})
```

**Instalar componente:**
```typescript
// Obtener comando para instalar
mcp_shadcn_get_add_command_for_items({
  items: ["@shadcn/badge", "@shadcn/avatar"]
})
// Retorna: npx shadcn@latest add @shadcn/badge @shadcn/avatar
```

### Prompts Útiles

- "Muéstrame los componentes disponibles en shadcn"
- "Busca un componente de formulario"
- "Cómo uso el componente accordion de shadcn"
- "Instala el componente badge de shadcn"
- "Muéstrame ejemplos de uso del componente dialog"
- "Busca componentes relacionados con tablas"

## 6. FlyonUI Community (Instalado)

**Tipo:** Biblioteca de componentes Tailwind CSS  
**Propósito:** Componentes UI con clases semánticas y plugins JavaScript  
**Estado:** ✅ Instalado y configurado (versión gratuita)  
**Licencia:** MIT (Open Source)

### Nota sobre FlyonUI MCP

El **FlyonUI MCP Server** (que genera bloques con IA) es parte de FlyonUI Pro (de pago) y NO está instalado. Lo que tenemos es **FlyonUI Community**, la biblioteca de componentes gratuita.

### FlyonUI Community - Componentes Disponibles

FlyonUI Community incluye 80+ componentes Tailwind CSS con clases semánticas:

#### Navegación
- Navbar, Breadcrumb, Tabs, Pagination, Steps

#### Formularios  
- Input, Select, Checkbox, Radio, Toggle, Range, File Input

#### Contenido
- Card, Badge, Alert, Avatar, Stat, Timeline, Table

#### Overlays
- Modal, Drawer, Dropdown, Tooltip, Popover

#### Feedback
- Loading, Progress, Skeleton, Toast

### Uso de FlyonUI Community

**Clases semánticas simples:**

```tsx
// Botón
<button className="btn btn-primary">Click me</button>

// Card
<div className="card">
  <div className="card-body">
    <h2 className="card-title">Título</h2>
    <p>Contenido</p>
  </div>
</div>

// Alert
<div className="alert alert-success">
  <span>Operación exitosa</span>
</div>

// Modal
<dialog className="modal">
  <div className="modal-box">
    <h3 className="modal-title">Título</h3>
    <p>Contenido del modal</p>
  </div>
</dialog>

// Stats
<div className="stats shadow">
  <div className="stat">
    <div className="stat-title">Total Plazas</div>
    <div className="stat-value">150</div>
  </div>
</div>
```

### Configuración Actual

**Instalado:**
```bash
npm install -D flyonui@latest
```

**Tailwind config:**
```typescript
plugins: [
  require("tailwindcss-animate"),
  require("flyonui")
]
```

**JavaScript importado en `main.tsx`:**
```typescript
import "flyonui/flyonui";
```

### Cuándo Usar FlyonUI vs shadcn/ui

**Usa FlyonUI cuando:**
- ✅ Necesitas componentes rápidos con clases semánticas
- ✅ Quieres menos código boilerplate
- ✅ Prefieres componentes JavaScript listos
- ✅ Necesitas temas predefinidos

**Usa shadcn/ui cuando:**
- ✅ Necesitas componentes altamente customizables
- ✅ Quieres control total del código
- ✅ Prefieres componentes basados en Radix UI
- ✅ Necesitas accesibilidad avanzada

**Ambos pueden coexistir** en el mismo proyecto.

### Referencias

- **Documentación:** https://flyonui.com/
- **Componentes:** https://flyonui.com/components/
- **GitHub:** https://github.com/themeselection/flyonui
- **Guía completa:** Ver `FLYONUI-COMMUNITY.md` en la raíz del proyecto

---

## 7. FlyonUI MCP Server (No instalado)

**Servidor:** `mcp_flyonui`  
**Propósito:** Generar UI blocks con IA (comandos `/iui`, `/cui`, `/rui`)  
**Estado:** ⚠️ NO instalado - Requiere licencia FlyonUI Pro (de pago)  
**Configuración:** Preparada pero deshabilitada en `.kiro/settings/mcp.json`

**Nota:** Este es el MCP server de IA para generar bloques automáticamente. Es diferente de FlyonUI Community (la biblioteca de componentes que SÍ tenemos instalada).

Si en el futuro quieres el MCP server de IA, necesitarías:
1. Comprar FlyonUI Pro (~$79-$399)
2. Obtener license key
3. Habilitar el MCP en `.kiro/settings/mcp.json`

---

## 8. Figma MCP Server

**Servidor:** `mcp_figma`  
**Propósito:** Convertir diseños de Figma a código React + Tailwind CSS  
**Estado:** ✅ Configurado y listo para usar  
**Licencia:** Gratis (oficial de Figma)

### Herramientas Disponibles

#### `get_figma_file`
Obtiene información completa de un archivo de Figma.

**Uso:**
```
"Obtén el archivo de Figma con ID: ABC123"
"Muéstrame la estructura del archivo: https://www.figma.com/file/ABC123/..."
```

**Retorna:**
- Estructura del documento
- Páginas y frames
- Componentes
- Estilos

#### `get_figma_node`
Obtiene un nodo específico (frame, componente, etc.) y lo convierte a código.

**Uso:**
```
"Extrae el frame 'Hero Section' del archivo ABC123 y conviértelo a React"
"Convierte el componente 'Button' del archivo ABC123 a código Tailwind"
```

**Retorna:**
- Propiedades del nodo
- Estilos aplicados
- Código React + Tailwind generado
- TypeScript types

#### `get_figma_components`
Lista todos los componentes de un archivo.

**Uso:**
```
"Muéstrame todos los componentes del archivo ABC123"
"Lista los componentes del design system"
```

**Retorna:**
- Nombres de componentes
- Descripciones
- Propiedades
- Variantes

#### `get_figma_styles`
Obtiene los estilos (colores, tipografía, efectos) de un archivo.

**Uso:**
```
"Extrae los colores del archivo ABC123"
"Muéstrame la tipografía del design system"
"Genera variables CSS desde los estilos de Figma"
```

**Retorna:**
- Color styles
- Text styles
- Effect styles
- Código CSS/Tailwind

#### `search_figma_files`
Busca archivos en tu cuenta de Figma.

**Uso:**
```
"Busca archivos de Figma con el nombre 'Landing Page'"
"Encuentra mis proyectos de diseño"
```

**Retorna:**
- Lista de archivos
- URLs
- Última modificación

### Configuración

**Token configurado:** ✅ Personal Access Token de Figma  
**Paquete:** `@hapins/figma-mcp`  
**Archivo:** `.kiro/settings/mcp.json`

```json
{
  "figma": {
    "command": "npx",
    "args": ["-y", "@hapins/figma-mcp"],
    "env": {
      "FIGMA_ACCESS_TOKEN": "figd_..."
    },
    "disabled": false
  }
}
```

### Cómo Obtener el File ID

El **File ID** está en la URL de Figma:

```
https://www.figma.com/file/ABC123XYZ789/Nombre-del-Proyecto
                            ^^^^^^^^^^^^
                            Este es el File ID
```

### Ejemplos para RESERVEO

**Convertir Hero Section:**
```
"Tengo un diseño de hero section en Figma (ID: ABC123, frame: 'Hero').
Conviértelo a React con Tailwind CSS para mi app de reservas de parking."
```

**Extraer Design System:**
```
"Extrae todos los colores y estilos de texto del archivo de Figma ABC123
y genera las variables CSS para mi proyecto."
```

**Convertir Componente:**
```
"Convierte el componente 'Parking Card' del archivo ABC123 a React.
Debe mostrar el número de plaza, disponibilidad y botón de reserva."
```

**Generar Dashboard:**
```
"Tengo un diseño de dashboard en Figma (ID: ABC123).
Genera los componentes React para:
- Header con navegación
- Sidebar con menú
- Cards de estadísticas
- Tabla de reservas
Usa Tailwind CSS y shadcn/ui cuando sea posible."
```

### Mejores Prácticas

1. **Organiza tus diseños en Figma:**
   - Usa frames con nombres descriptivos
   - Agrupa componentes relacionados
   - Usa Auto Layout para layouts responsive
   - Nombra las capas correctamente

2. **Define Variables y Estilos:**
   - Color Styles para tu paleta
   - Text Styles para tipografía
   - Components reutilizables
   - Variables de Figma para tokens

3. **Prompts efectivos:**
   ```
   ✅ "Convierte el frame 'Hero Section' del archivo ABC123 a React con Tailwind"
   ✅ "Extrae los componentes del archivo ABC123 y genera código TypeScript"
   ❌ "Convierte esto a código"
   ❌ "Dame el diseño"
   ```

### Características

- ✅ Conversión automática a código React + Tailwind
- ✅ Respeta design system (tokens, componentes)
- ✅ Genera TypeScript types
- ✅ Mantiene accesibilidad (aria-labels)
- ✅ Extrae variables y estilos
- ✅ Compatible con Code Connect
- ✅ Completamente gratis

### Referencias

- **Blog oficial:** https://www.figma.com/blog/introducing-figmas-dev-mode-mcp-server/
- **Figma API:** https://developers.figma.com/docs/rest-api/
- **Guía completa:** Ver `FIGMA-MCP-SETUP.md` en la raíz del proyecto

---

## 9. Vercel MCP Server

**Servidor:** `mcp_vercel`  
**Propósito:** Gestión de deployments y proyectos en Vercel

### Herramientas Disponibles

#### Comandos Principales

FlyonUI MCP funciona con 3 comandos especiales que se usan en el chat:

##### `/iui` - Inspire UI
Genera diseños únicos inspirados en bloques de FlyonUI.

**Uso:**
```
/iui Create a hero section for my AI SaaS - AI Video Generator
/iui Create a feature section for my productivity app
/iui Create a pricing section with 3 tiers
```

**Cuándo usar:**
- Quieres algo nuevo y creativo
- Necesitas diseños únicos
- Buscas inspiración de mejores prácticas

##### `/cui` - Create UI
Usa bloques existentes de FlyonUI personalizados con tu contenido.

**Uso:**
```
/cui Create a hero section for an eLearning Academy site
/cui Create a feature section like Features 8
/cui Create a pricing section like Pricing 5 for my SaaS
```

**Cuándo usar:**
- Quieres replicar un bloque específico
- Necesitas diseños probados
- Quieres personalizar bloques existentes

##### `/rui` - Refine UI
Edita, ajusta o mejora componentes existentes.

**Uso:**
```
/rui Update the theme to dark mode
/rui Replace the "Get Started" button with Login and Register buttons
/rui Change the Hero section layout from horizontal to vertical
/rui Add a gradient background
```

**Cuándo usar:**
- Necesitas ajustar un componente
- Quieres cambiar colores/layout
- Necesitas iterar sobre un diseño

### Resumen de Comandos

| Comando | Propósito | Ideal Para |
|---------|-----------|------------|
| `/iui` | Generar diseño único inspirado | Creatividad y diseños originales |
| `/cui` | Personalizar bloque existente | Usar bloques probados con tu contenido |
| `/rui` | Refinar/editar componente | Hacer ajustes y mejoras |

### Configuración

**Archivo:** `.kiro/settings/mcp.json`

```json
{
  "flyonui": {
    "command": "npx",
    "args": ["-y", "@themeselection/flyonui-mcp"],
    "env": {
      "FLYONUI_LICENSE_KEY": "tu_license_key_aqui"
    },
    "disabled": false,
    "autoApprove": [
      "inspire_ui",
      "create_ui",
      "refine_ui",
      "get_blocks",
      "search_blocks"
    ]
  }
}
```

**Instalación del plugin en el proyecto:**

```bash
npm install flyonui
```

**Configurar en `tailwind.config.ts`:**

```typescript
export default {
  plugins: [
    require("tailwindcss-animate"),
    require("flyonui"),
    require("flyonui/plugin")
  ],
} satisfies Config;
```

### Características

**Incluye:**
- 500+ Bloques Tailwind (Hero, Features, Pricing, Testimonials, etc.)
- 20+ Templates completos (Dashboards, Landing Pages)
- 100+ Páginas listas para usar
- 80+ Componentes UI
- Figma Design System
- Compatible con React, Next.js, Vue, Nuxt, Svelte
- Código production-ready
- Actualizaciones automáticas

### Mejores Prácticas

1. **Prompts claros y específicos**
   ```
   ✅ /cui Create a hero section for my parking app with CTA button
   ❌ /cui Create a hero
   ```

2. **Un bloque a la vez**
   ```
   ✅ /cui Create the Pricing section
   ✅ /cui Create the Testimonials section
   ❌ /cui Create Pricing, Testimonials and CTA
   ```

3. **Usar Agent Mode** (siempre activado en Kiro)

4. **Nuevo chat por componente** (evita confusión de contexto)

5. **Iterar con `/rui`** para refinar diseños

### Ejemplos para RESERVEO

**Hero Section:**
```
/cui Create a hero section for a corporate parking reservation system.
Include headline "Reserve your parking spot in seconds",
subheadline about smart parking management,
and two CTA buttons: "Get Started" and "View Demo"
```

**Features Section:**
```
/cui Create a features section like Features 8 showcasing:
- Interactive parking map
- Real-time availability
- License plate management
- Admin dashboard
Use icons from lucide-react
```

**Dashboard Stats:**
```
/iui Create a stats section for admin dashboard showing:
- Total parking spots
- Active reservations
- Available spots today
- Monthly usage
Use cards with icons and numbers
```

### Limitaciones

- ⚠️ **Requiere licencia de pago** (~$79-$399 según plan)
- Funciona mejor con Claude Sonnet 3.7+
- `/iui` puede ser lento para páginas completas
- Genera un bloque a la vez para mejores resultados

### Obtener Licencia

1. Visita: https://flyonui.com/pro
2. Compra plan (Pro/Team/Enterprise)
3. Obtén tu license key en: https://flyonui.com/purchases
4. Configura en `.kiro/settings/mcp.json`

**Instrucciones completas:** Ver archivo `FLYONUI-SETUP.md` en la raíz del proyecto

### Referencias

- **Documentación:** https://flyonui.com/docs/pro/mcp/
- **Bloques disponibles:** https://flyonui.com/pro
- **Soporte:** https://discord.com/invite/kBHkY7DekX

## 7. Vercel MCP Server

**Servidor:** `mcp_vercel`  
**Propósito:** Gestión de deployments y proyectos en Vercel

### Herramientas Disponibles

#### `search_vercel_documentation`
Busca en la documentación de Vercel.

```typescript
mcp_vercel_search_vercel_documentation({
  topic: "environment variables",
  tokens: 2500
})
```

**Temas útiles:**
- `environment variables`
- `deployments`
- `edge functions`
- `caching`
- `routing`

#### `deploy_to_vercel`
Despliega el proyecto actual a Vercel.

```typescript
mcp_vercel_deploy_to_vercel()
```

**⚠️ Usar con precaución:** Crea un deployment en producción.

#### `list_projects`
Lista todos los proyectos de Vercel (max 50).

```typescript
mcp_vercel_list_projects({
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj"
})
```

**Retorna:**
- Project IDs
- Nombres de proyectos
- URLs

#### `get_project`
Obtiene información de un proyecto específico.

```typescript
mcp_vercel_get_project({
  projectId: "prj_TcQ3rzoqL0xchwZYNp7IUAnxZ1L1",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj"
})
```

**Retorna:**
- Configuración del proyecto
- Variables de entorno
- Dominios
- Framework detectado

#### `list_deployments`
Lista deployments de un proyecto.

```typescript
mcp_vercel_list_deployments({
  projectId: "prj_TcQ3rzoqL0xchwZYNp7IUAnxZ1L1",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj",
  since: 1699999999000,
  until: 1700000000000
})
```

**Retorna:**
- URLs de deployments
- Estados (READY, ERROR, BUILDING)
- Timestamps
- Commits asociados

#### `get_deployment`
Obtiene información de un deployment específico.

```typescript
mcp_vercel_get_deployment({
  idOrUrl: "dpl_xxx",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj"
})
```

#### `get_deployment_build_logs`
Obtiene logs de build de un deployment.

```typescript
mcp_vercel_get_deployment_build_logs({
  idOrUrl: "dpl_xxx",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj",
  limit: 100
})
```

**Uso recomendado:**
- Debugging de builds fallidos
- Verificar errores de deployment
- Analizar tiempos de build

#### `get_access_to_vercel_url`
Genera URL temporal para acceder a deployments protegidos.

```typescript
mcp_vercel_get_access_to_vercel_url({
  url: "https://myapp-abc123.vercel.app"
})
```

**Uso recomendado:**
- Acceder a previews protegidos
- Compartir acceso temporal

#### `web_fetch_vercel_url`
Obtiene contenido de una URL de Vercel con autenticación.

```typescript
mcp_vercel_web_fetch_vercel_url({
  url: "https://myapp.vercel.app/api/status"
})
```

**Uso recomendado:**
- Verificar deployments protegidos
- Testear APIs en preview

#### `list_teams`
Lista los equipos del usuario.

```typescript
mcp_vercel_list_teams()
```

**Retorna:**
- Team IDs
- Nombres de equipos
- Slugs

#### `check_domain_availability_and_price`
Verifica disponibilidad de dominios.

```typescript
mcp_vercel_check_domain_availability_and_price({
  names: ["reserveo.com", "reserveo.app"]
})
```

**Retorna:**
- Disponibilidad
- Precios
- Información de registro

## Configuración Actual del Proyecto

### IDs Importantes

```bash
# Supabase
Project ID: rlrzcfnhhvrvrxzfifeh
Project URL: https://rlrzcfnhhvrvrxzfifeh.supabase.co

# Vercel
Project ID: prj_TcQ3rzoqL0xchwZYNp7IUAnxZ1L1
Team ID: team_TPhaQhZC6XMlLHwfJtQjojBj
Project Name: reservo-spot
```

### Ubicación de Configuración

**MCP Config:** `.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "supabase": { ... },
    "fetch": { ... },
    "memory": { ... },
    "brave-search": { ... },
    "shadcn": { ... },
    "flyonui": { ... },
    "figma": { ... },
    "vercel": { ... }
  }
}
```

## Mejores Prácticas

### Cuándo Usar Cada MCP

**Supabase MCP:**
- ✅ Inspeccionar datos antes de cambios
- ✅ Verificar políticas RLS
- ✅ Contar registros
- ✅ Leer migraciones
- ❌ NO para modificar datos (usar código)

**Fetch MCP:**
- ✅ Consultar documentación externa
- ✅ Verificar APIs públicas
- ❌ NO para datos sensibles

**Memory MCP:**
- ✅ Recordar decisiones importantes
- ✅ Guardar contexto entre sesiones
- ✅ Documentar problemas recurrentes
- ❌ NO para datos temporales

**Brave Search MCP:**
- ✅ Buscar soluciones a errores
- ✅ Investigar mejores prácticas
- ✅ Documentación actualizada
- ❌ NO para información del proyecto

**shadcn MCP:**
- ✅ Explorar componentes disponibles
- ✅ Buscar componentes específicos
- ✅ Ver ejemplos de uso
- ✅ Instalar componentes de registries
- ❌ NO modifica componentes ya instalados

**FlyonUI Community:**
- ✅ 80+ componentes Tailwind CSS
- ✅ Clases semánticas fáciles de usar
- ✅ Plugins JavaScript interactivos
- ✅ Completamente gratis (MIT)
- ✅ Ya instalado en el proyecto

**Figma MCP:**
- ✅ Convertir diseños de Figma a código
- ✅ Extraer componentes y estilos
- ✅ Generar React + Tailwind automáticamente
- ✅ Mantener design system
- ✅ Completamente gratis

**Vercel MCP:**
- ✅ Verificar deployments
- ✅ Debugging de builds
- ✅ Gestionar dominios
- ⚠️ Cuidado con deployments automáticos

## Ejemplos de Uso Común

### Verificar Estado de la BD

```typescript
// 1. Listar tablas
mcp_supabase_reserveo_supabase_list_tables()

// 2. Ver estructura de tabla
mcp_supabase_reserveo_supabase_describe_table({
  tableName: "incident_reports"
})

// 3. Contar registros
mcp_supabase_reserveo_supabase_count_records({
  tableName: "incident_reports",
  filters: { status: "pending" }
})

// 4. Verificar RLS
mcp_supabase_reserveo_supabase_get_rls_policies({
  tableName: "incident_reports"
})
```

### Debugging de Deployment

```typescript
// 1. Listar deployments recientes
mcp_vercel_list_deployments({
  projectId: "prj_TcQ3rzoqL0xchwZYNp7IUAnxZ1L1",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj"
})

// 2. Ver logs del último deployment
mcp_vercel_get_deployment_build_logs({
  idOrUrl: "dpl_xxx",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj",
  limit: 100
})
```

### Investigar Error

```typescript
// 1. Buscar en web
mcp_brave_search_brave_web_search({
  query: "Supabase RLS policy not working authenticated users",
  count: 5
})

// 2. Consultar documentación
mcp_vercel_search_vercel_documentation({
  topic: "authentication"
})

// 3. Obtener contenido específico
mcp_fetch_fetch({
  url: "https://supabase.com/docs/guides/auth/row-level-security"
})
```

### Explorar y Usar Componentes shadcn

```typescript
// 1. Buscar componente
mcp_shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "dialog"
})

// 2. Ver ejemplo de uso
mcp_shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "dialog-demo"
})

// 3. Obtener comando de instalación
mcp_shadcn_get_add_command_for_items({
  items: ["@shadcn/dialog"]
})

// 4. Verificar instalación
mcp_shadcn_get_audit_checklist()
```

## 10. 21st.dev Magic MCP Server

**Servidor:** `mcp_21st_devmagic`  
**Propósito:** Generación de componentes UI con IA usando la biblioteca de 21st.dev  
**Estado:** ✅ Configurado y listo para usar  
**Licencia:** Requiere API Key (configurada)

### Herramientas Disponibles

#### `21st_magic_component_builder`
Genera componentes UI personalizados basados en tu solicitud.

**Uso:**
```typescript
mcp_21st_devmagic_21st_magic_component_builder({
  message: "Create a parking spot card with number, availability status and reserve button",
  searchQuery: "parking card component",
  absolutePathToCurrentFile: "/Users/rubenmarques/reserveokiro/reservo-spot/src/components/ParkingCard.tsx",
  absolutePathToProjectDirectory: "/Users/rubenmarques/reserveokiro/reservo-spot",
  standaloneRequestQuery: "Create a card component for parking spots showing spot number, availability indicator (green/red), and a reserve button. Should be responsive and use Tailwind CSS."
})
```

**Parámetros:**
- `message` (requerido) - Mensaje completo del usuario
- `searchQuery` (requerido) - Query de búsqueda (2-4 palabras max)
- `absolutePathToCurrentFile` (requerido) - Ruta absoluta del archivo actual
- `absolutePathToProjectDirectory` (requerido) - Ruta absoluta del proyecto
- `standaloneRequestQuery` (requerido) - Descripción detallada del componente a crear

**Retorna:**
- Código del componente generado
- Instrucciones de implementación
- Dependencias necesarias

**Uso recomendado:**
- Crear componentes UI nuevos rápidamente
- Generar variantes de componentes existentes
- Prototipar interfaces

#### `logo_search`
Busca y retorna logos de empresas en formato JSX, TSX o SVG.

**Uso:**
```typescript
mcp_21st_devmagic_logo_search({
  queries: ["discord", "github", "slack"],
  format: "TSX"
})
```

**Parámetros:**
- `queries` (requerido) - Array de nombres de empresas
- `format` (requerido) - "JSX", "TSX" o "SVG"

**Retorna:**
- Componente de icono (ej: `DiscordIcon`)
- Código completo del componente
- Instrucciones de importación

**Uso recomendado:**
- Añadir logos de empresas sin buscar SVGs manualmente
- Integrar iconos de marcas conocidas
- Crear secciones de "partners" o "integrations"

**Ejemplos:**
```typescript
// Buscar un logo
mcp_21st_devmagic_logo_search({
  queries: ["microsoft"],
  format: "TSX"
})

// Buscar múltiples logos
mcp_21st_devmagic_logo_search({
  queries: ["discord", "github", "slack", "notion"],
  format: "TSX"
})
```

#### `21st_magic_component_inspiration`
Busca componentes existentes en 21st.dev para inspiración (sin generar código).

**Uso:**
```typescript
mcp_21st_devmagic_21st_magic_component_inspiration({
  message: "Show me examples of pricing tables",
  searchQuery: "pricing table"
})
```

**Parámetros:**
- `message` (requerido) - Mensaje completo del usuario
- `searchQuery` (requerido) - Query de búsqueda (2-4 palabras)

**Retorna:**
- JSON con componentes encontrados
- Previews y metadata
- NO genera código nuevo

**Uso recomendado:**
- Ver ejemplos antes de crear
- Explorar patrones de diseño
- Obtener inspiración

#### `21st_magic_component_refiner`
Mejora y refina componentes UI existentes.

**Uso:**
```typescript
mcp_21st_devmagic_21st_magic_component_refiner({
  userMessage: "Make the button larger and add a hover effect",
  absolutePathToRefiningFile: "/Users/rubenmarques/reserveokiro/reservo-spot/src/components/Button.tsx",
  context: "User wants to improve the button component by making it larger and adding a smooth hover effect with scale transformation"
})
```

**Parámetros:**
- `userMessage` (requerido) - Mensaje del usuario sobre mejoras
- `absolutePathToRefiningFile` (requerido) - Ruta absoluta del archivo a refinar
- `context` (requerido) - Contexto detallado de qué mejorar

**Retorna:**
- Versión mejorada del componente
- Instrucciones de implementación
- Cambios aplicados

**Uso recomendado:**
- Mejorar diseño de componentes existentes
- Añadir interactividad
- Refinar estilos y layout

### Configuración

**Archivo:** `~/.kiro/settings/mcp.json`

```json
{
  "@21st-dev/magic": {
    "command": "npx",
    "args": [
      "-y",
      "@21st-dev/magic@latest",
      "API_KEY=\"bba1fc0b4dbe8e8969ebf3cec680dfd8ae4a68e5115c1ecbf1f1e063d68b7633\""
    ],
    "disabled": false,
    "autoApprove": []
  }
}
```

### Comandos Especiales

Puedes usar comandos especiales en el chat:

- `/ui` - Generar componente UI
- `/21` o `/21st` - Usar herramientas de 21st.dev
- `/logo` - Buscar logos de empresas

**Ejemplos:**
```
/ui Create a card for parking spots with availability indicator
/21 Show me pricing table examples
/logo GitHub Discord Slack
```

### Mejores Prácticas

1. **Prompts específicos y detallados**
   ```
   ✅ "Create a parking spot card with spot number (large text), 
       availability badge (green/red), spot type icons (accessible, 
       charger, compact), and a reserve button"
   ❌ "Create a card"
   ```

2. **Usar rutas absolutas correctas**
   - Siempre proporcionar rutas absolutas completas
   - Verificar que el directorio del proyecto es correcto

3. **Search queries concisos**
   ```
   ✅ "parking card"
   ✅ "pricing table"
   ❌ "create a component that shows parking information"
   ```

4. **Context detallado para refiner**
   - Especificar exactamente qué elementos mejorar
   - Mencionar aspectos específicos (colores, layout, interactividad)

### Ejemplos para RESERVEO

**Crear Card de Plaza:**
```
/ui Create a parking spot card component showing:
- Spot number (large, bold)
- Availability status badge (green for available, red for occupied)
- Icons for spot features (wheelchair accessible, EV charger, compact)
- Reserve button (primary color, disabled when occupied)
Use Tailwind CSS and make it responsive
```

**Buscar Logos:**
```
/logo Tesla BMW Mercedes Volkswagen
```

**Refinar Componente:**
```
/21 Refine the ParkingCard component to add:
- Smooth hover effect with slight scale
- Shadow on hover
- Better spacing between elements
- Rounded corners
```

**Ver Inspiración:**
```
/21 Show me examples of dashboard stat cards
/21 Find calendar component examples
```

### Características

- ✅ Genera componentes React + TypeScript
- ✅ Usa Tailwind CSS automáticamente
- ✅ Respeta el estilo del proyecto
- ✅ Biblioteca de 1000+ componentes
- ✅ Logos de empresas populares
- ✅ Refinamiento de componentes existentes
- ✅ Búsqueda de inspiración

### Cuándo Usar 21st.dev Magic

**Usa 21st.dev cuando:**
- ✅ Necesitas crear componentes UI rápidamente
- ✅ Quieres prototipar interfaces
- ✅ Necesitas logos de empresas
- ✅ Quieres mejorar componentes existentes
- ✅ Buscas inspiración de diseño

**Usa shadcn/ui cuando:**
- ✅ Necesitas componentes base del design system
- ✅ Quieres componentes con accesibilidad garantizada
- ✅ Prefieres componentes probados y estables

**Usa FlyonUI cuando:**
- ✅ Necesitas componentes con clases semánticas
- ✅ Quieres menos código boilerplate

**Todos pueden coexistir** - usa cada uno según la necesidad.

### Limitaciones

- Requiere API Key (ya configurada)
- Genera un componente a la vez
- Mejor para componentes pequeños/medianos
- No reemplaza el diseño manual para casos complejos

### Referencias

- **Sitio oficial:** https://21st.dev/
- **Documentación MCP:** https://github.com/21st-dev/magic-mcp
- **Biblioteca de componentes:** https://21st.dev/components

---

## Cuándo Usar Cada MCP - Resumen

**21st.dev Magic:**
- ✅ Generar componentes UI con IA
- ✅ Buscar logos de empresas
- ✅ Refinar componentes existentes
- ✅ Obtener inspiración de diseño
- ❌ NO para componentes base del design system

## Limitaciones y Consideraciones

1. **Rate Limits:** Algunos MCPs tienen límites de uso
2. **Autenticación:** Requieren configuración previa
3. **Permisos:** Respetan permisos del usuario
4. **Costo:** Algunos servicios pueden tener costo (Brave Search, 21st.dev)
5. **Disponibilidad:** Dependen de servicios externos

## Referencias

- [MCP Protocol](https://modelcontextprotocol.io/)
- [Supabase MCP](https://github.com/supabase-community/mcp-server-supabase)
- [Vercel MCP](https://github.com/vercel/mcp-server-vercel)
- [21st.dev Magic MCP](https://github.com/21st-dev/magic-mcp)
