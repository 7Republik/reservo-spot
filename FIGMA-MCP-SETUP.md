# 🎨 Figma MCP Server - Guía de Instalación

## ✅ Estado Actual

- [x] Configuración MCP preparada en `.kiro/settings/mcp.json` (deshabilitada)
- [ ] Obtener Personal Access Token de Figma
- [ ] Configurar token en MCP
- [ ] Activar MCP server
- [ ] Probar con un archivo de Figma

---

## 🎯 ¿Qué es Figma MCP?

El **Figma MCP Server** (`figma-developer-mcp`) te permite:

- ✅ Convertir diseños de Figma a código React + Tailwind CSS
- ✅ Extraer componentes, variables y estilos automáticamente
- ✅ Generar código con TypeScript
- ✅ Mantener accesibilidad (aria-labels automáticos)
- ✅ Respetar tu design system (tokens, componentes)
- ✅ Integración con Code Connect

**Completamente GRATIS** - No requiere licencia de pago

**Paquete npm:** `@hapins/figma-mcp` (alternativa estable sin conflictos de puerto)

---

## 📝 Paso 1: Crear Personal Access Token en Figma

### 1.1 Acceder a Settings

1. Ve a https://www.figma.com/
2. Haz clic en tu **avatar** (arriba a la derecha)
3. Selecciona **"Settings"**

### 1.2 Generar el Token

1. Baja hasta la sección **"Personal access tokens"**
2. En el campo de texto, escribe una descripción:
   - Ejemplo: `MCP Server`
   - Ejemplo: `Kiro Integration`
   - Ejemplo: `Dev Tools`
3. Presiona **Enter** o **Return**
4. Se generará un token que empieza con `figd_...`

### 1.3 ⚠️ IMPORTANTE: Copiar el Token

- **El token solo se muestra UNA VEZ**
- Cópialo inmediatamente
- Guárdalo en un lugar seguro (lo necesitarás en el siguiente paso)

**Formato del token:**
```
figma_token_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
(Los tokens reales empiezan con `figd_`)

---

## 🔧 Paso 2: Configurar el Token en Kiro

### 2.1 Editar la Configuración MCP

Abre el archivo `.kiro/settings/mcp.json` y busca la sección de `figma`:

```json
{
  "figma": {
    "command": "npx",
    "args": ["-y", "@hapins/figma-mcp"],
    "env": {
      "FIGMA_ACCESS_TOKEN": "TU_TOKEN_FIGMA_AQUI"  // 👈 Cambiar esto
    },
    "disabled": true,  // 👈 Cambiar a false
    "autoApprove": [
      "get_figma_file",
      "get_figma_node",
      "get_figma_image",
      "list_figma_files"
    ]
  }
}
```

### 2.2 Reemplazar el Token

1. Reemplaza `TU_TOKEN_FIGMA_AQUI` con tu token real de Figma
2. Cambia `"disabled": true` a `"disabled": false`
3. Guarda el archivo

**Ejemplo:**
```json
{
  "figma": {
    "command": "npx",
    "args": [
      "-y",
      "figma-developer-mcp",
      "--figma-api-key",
      "TU_TOKEN_FIGMA_AQUI"
    ],
    "disabled": false
  }
}
```

### 2.3 Instalar el Paquete Globalmente (Recomendado)

Para evitar timeouts, instala el paquete globalmente:

```bash
npm install -g figma-developer-mcp
```

Luego actualiza la configuración para usar el comando directo:

```json
{
  "figma": {
    "command": "figma-developer-mcp",  // 👈 Sin npx
    "args": [
      "--figma-api-key",
      "tu_token_aqui"
    ],
    "disabled": false
  }
}
```

### 2.4 Reiniciar Kiro

Después de cambiar la configuración:
1. Cierra y abre Kiro
2. O usa el comando: **Reload Window**

---

## 🚀 Paso 3: Verificar la Instalación

### 3.1 Comprobar el MCP Server

1. Abre Kiro
2. Ve a la vista de **MCP Servers**
3. Deberías ver **figma** con un punto verde ✅

### 3.2 Probar con un Archivo de Figma

Para probar el MCP, necesitas:

1. **Un archivo de Figma** (puede ser cualquiera)
2. **La URL del archivo** (ejemplo: `https://www.figma.com/file/ABC123/Mi-Proyecto`)
3. **El File ID** (la parte `ABC123` de la URL)

**Ejemplo de prueba:**
```
"Extrae los componentes del archivo de Figma con ID: ABC123"
"Convierte este diseño de Figma a React: https://www.figma.com/file/ABC123/..."
"Muéstrame los estilos del archivo de Figma ABC123"
```

---

## 🎯 Cómo Usar Figma MCP

### Herramientas Disponibles

El Figma MCP proporciona varias herramientas:

#### 1. `get_figma_file`
Obtiene información completa de un archivo de Figma.

**Uso:**
```
"Obtén el archivo de Figma con ID: ABC123"
"Muéstrame la estructura del archivo de Figma: https://www.figma.com/file/ABC123/..."
```

**Retorna:**
- Estructura del documento
- Páginas y frames
- Componentes
- Estilos

#### 2. `get_figma_node`
Obtiene un nodo específico (frame, componente, etc.) de un archivo.

**Uso:**
```
"Extrae el frame 'Hero Section' del archivo ABC123"
"Convierte el componente 'Button' a código React"
```

**Retorna:**
- Propiedades del nodo
- Estilos aplicados
- Hijos del nodo
- Código React + Tailwind generado

#### 3. `get_figma_components`
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

#### 4. `get_figma_styles`
Obtiene los estilos (colores, tipografía, efectos) de un archivo.

**Uso:**
```
"Extrae los colores del archivo ABC123"
"Muéstrame la tipografía del design system"
```

**Retorna:**
- Color styles
- Text styles
- Effect styles
- Código CSS/Tailwind

#### 5. `search_figma_files`
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

---

## 💡 Ejemplos Prácticos para RESERVEO

### Convertir Hero Section de Figma a React

```
"Tengo un diseño de hero section en Figma (ID: ABC123, frame: 'Hero').
Conviértelo a React con Tailwind CSS para mi app de reservas de parking."
```

**El MCP generará:**
```tsx
export const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-primary to-primary-glow py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold text-white mb-4">
          Reserva tu Plaza de Parking
        </h1>
        <p className="text-xl text-white/90 mb-8">
          Sistema inteligente de gestión de parking corporativo
        </p>
        <button className="btn btn-primary">
          Comenzar Ahora
        </button>
      </div>
    </section>
  );
};
```

### Extraer Design System

```
"Extrae todos los colores y estilos de texto del archivo de Figma ABC123
y genera las variables CSS para mi proyecto."
```

**El MCP generará:**
```css
:root {
  --primary: #3b82f6;
  --secondary: #8b5cf6;
  --success: #10b981;
  --error: #ef4444;
  
  --text-heading: 2.5rem;
  --text-body: 1rem;
  --text-small: 0.875rem;
}
```

### Convertir Componente de Card

```
"Convierte el componente 'Parking Card' del archivo ABC123 a React.
Debe mostrar el número de plaza, disponibilidad y botón de reserva."
```

### Generar Dashboard desde Figma

```
"Tengo un diseño de dashboard en Figma (ID: ABC123).
Genera los componentes React para:
- Header con navegación
- Sidebar con menú
- Cards de estadísticas
- Tabla de reservas
Usa Tailwind CSS y los componentes de shadcn/ui cuando sea posible."
```

---

## 🎨 Mejores Prácticas

### 1. Organiza tus Diseños en Figma

- **Usa frames con nombres descriptivos:** "Hero Section", "Pricing Card", etc.
- **Agrupa componentes relacionados**
- **Usa Auto Layout** para layouts responsive
- **Nombra las capas correctamente**

### 2. Define Variables y Estilos

- **Color Styles:** Define tu paleta de colores
- **Text Styles:** Define tipografía consistente
- **Components:** Crea componentes reutilizables
- **Variables:** Usa variables de Figma para tokens

### 3. Usa Code Connect (Opcional)

Si usas Code Connect en Figma:
- El MCP puede generar código más preciso
- Mapea componentes de Figma a tu código
- Mantiene sincronización diseño-código

### 4. Prompts Efectivos

**✅ Buenos prompts:**
```
"Convierte el frame 'Hero Section' del archivo ABC123 a React con Tailwind"
"Extrae los componentes del archivo ABC123 y genera código TypeScript"
"Muéstrame los colores del design system en el archivo ABC123"
```

**❌ Prompts vagos:**
```
"Convierte esto a código"
"Dame el diseño"
"Genera componentes"
```

---

## 🔍 Obtener el File ID de Figma

El **File ID** es necesario para usar el MCP. Aquí está cómo obtenerlo:

### Desde la URL del Archivo

La URL de Figma tiene este formato:
```
https://www.figma.com/file/ABC123XYZ789/Nombre-del-Proyecto
                            ^^^^^^^^^^^^
                            Este es el File ID
```

**Ejemplo:**
```
URL: https://www.figma.com/file/kH3vQ2rL8pM9nB4xC5yD6z/RESERVEO-Design
File ID: kH3vQ2rL8pM9nB4xC5yD6z
```

### Desde el Navegador

1. Abre tu archivo en Figma
2. Mira la barra de direcciones
3. Copia la parte entre `/file/` y el siguiente `/`

---

## 🆚 Figma MCP vs Otros Métodos

### Figma MCP (Recomendado)
- ✅ Conversión automática a código
- ✅ Respeta design system
- ✅ Genera TypeScript + Tailwind
- ✅ Mantiene accesibilidad
- ✅ Gratis

### Figma Dev Mode
- ✅ Inspección manual de propiedades
- ❌ Copiar/pegar código manualmente
- ❌ No genera componentes completos
- 💰 Requiere plan de pago

### Plugins de Figma
- ✅ Algunos generan código
- ❌ Calidad variable
- ❌ Requiere instalación manual
- ⚠️ Algunos son de pago

---

## 🆘 Troubleshooting

### El MCP no aparece

**Solución:**
1. Verifica que `disabled: false` en el config
2. Reinicia Kiro completamente
3. Verifica que el token es correcto

### Error de autenticación

**Solución:**
1. Verifica que copiaste el token completo
2. No debe tener espacios al inicio/final
3. Debe empezar con `figd_`
4. Genera un nuevo token si es necesario

### No encuentra el archivo

**Solución:**
1. Verifica que el File ID es correcto
2. Asegúrate de tener acceso al archivo en Figma
3. El archivo debe ser tuyo o compartido contigo

### Código generado no es correcto

**Solución:**
1. Sé más específico en tu prompt
2. Menciona el framework (React, Vue, etc.)
3. Especifica el sistema de estilos (Tailwind, CSS, etc.)
4. Indica si quieres usar componentes existentes (shadcn/ui, FlyonUI)

### Token expirado

**Solución:**
1. Los tokens de Figma no expiran automáticamente
2. Si revocaste el token, genera uno nuevo
3. Actualiza el token en `.kiro/settings/mcp.json`

### Error "404 Not Found" al instalar

**Problema:** El paquete `@figma/mcp-server-figma` no existe.

**Solución:**
- El paquete correcto es `figma-developer-mcp`
- Verifica que tu configuración use:
  ```json
  "args": ["--figma-api-key", "tu_token"]
  ```

### Timeout al conectar

**Problema:** "Request timed out" al iniciar el MCP.

**Solución:**
1. Instala el paquete globalmente:
   ```bash
   npm install -g figma-developer-mcp
   ```

2. Cambia la configuración para usar el comando directo:
   ```json
   {
     "command": "figma-developer-mcp",  // Sin npx
     "args": ["--figma-api-key", "tu_token"]
   }
   ```

3. Reinicia Kiro

### Error "EADDRINUSE: address already in use"

**Problema:** El puerto 3333 ya está en uso.

**Solución:**
1. Mata el proceso que usa el puerto:
   ```bash
   lsof -ti:3333 | xargs kill -9
   ```

2. O usa un puerto diferente (si el MCP lo soporta)

3. Reinicia Kiro

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE: Protege tu Token

- **NUNCA subas el token a Git**
- El archivo `.kiro/settings/mcp.json` está en `.gitignore`
- No compartas tu token con nadie
- Si se compromete, revócalo inmediatamente en Figma Settings

### Revocar un Token

Si necesitas revocar un token:
1. Ve a Figma Settings
2. Sección "Personal access tokens"
3. Haz clic en el icono de papelera junto al token
4. Genera uno nuevo si es necesario

---

## 📚 Recursos

### Documentación Oficial
- **Figma MCP:** https://www.figma.com/blog/introducing-figmas-dev-mode-mcp-server/
- **Figma API:** https://developers.figma.com/docs/rest-api/
- **Personal Access Tokens:** https://help.figma.com/hc/en-us/articles/8085703771159

### Comunidad
- **Figma Community:** https://www.figma.com/community
- **Figma Forum:** https://forum.figma.com/

---

## ✨ Próximos Pasos

1. **Crea tu token** en Figma Settings
2. **Configura el MCP** con tu token
3. **Reinicia Kiro**
4. **Prueba con un archivo** de Figma
5. **Convierte diseños** a código React + Tailwind

---

## 🎉 ¡Listo!

Una vez configurado, podrás convertir cualquier diseño de Figma a código con comandos simples como:

```
"Convierte el hero section del archivo ABC123 a React con Tailwind"
```

¡Disfruta convirtiendo diseños a código automáticamente! 🚀
