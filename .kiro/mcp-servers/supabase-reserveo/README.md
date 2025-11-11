# Supabase Reserveo MCP Server

MCP (Model Context Protocol) server personalizado para gestionar el proyecto Supabase de Reserveo.

## 🎯 Propósito

Este servidor MCP proporciona herramientas para que Kiro pueda:
- Consultar la base de datos directamente
- Listar y describir tablas
- Gestionar migraciones
- Ejecutar comandos de Supabase CLI
- Ver información del proyecto
- Contar registros y verificar políticas RLS

## 📦 Instalación

### 1. Instalar dependencias

```bash
cd .kiro/mcp-servers/supabase-reserveo
npm install
```

### 2. Verificar configuración

El archivo `.kiro/settings/mcp.json` ya está configurado con:
- Project Ref: `pevpefnemqvyygkrcwir`
- URL del proyecto
- Anon Key (pública)

### 3. Reiniciar Kiro

Para que Kiro detecte el nuevo servidor MCP:
1. Abre la paleta de comandos (Cmd/Ctrl + Shift + P)
2. Busca "MCP: Reconnect Servers"
3. O reinicia Kiro completamente

## 🛠️ Herramientas Disponibles

### 1. `supabase_query`
Ejecuta consultas SQL SELECT en la base de datos.

**Ejemplo:**
```
Ejecuta: SELECT * FROM profiles LIMIT 5
```

**Parámetros:**
- `query` (string): Consulta SQL SELECT

**Seguridad:** Solo permite SELECT por seguridad.

---

### 2. `supabase_list_tables`
Lista todas las tablas en el esquema público.

**Ejemplo:**
```
Lista todas las tablas de la base de datos
```

**Retorna:**
- Lista de tablas con nombre y tipo
- Contador total

---

### 3. `supabase_describe_table`
Obtiene información detallada de una tabla (columnas, tipos, constraints).

**Ejemplo:**
```
Describe la tabla profiles
```

**Parámetros:**
- `tableName` (string): Nombre de la tabla

**Retorna:**
- Columnas con tipos de datos
- Nullability
- Valores por defecto
- Longitud máxima

---

### 4. `supabase_list_migrations`
Lista todos los archivos de migración en `supabase/migrations/`.

**Ejemplo:**
```
Lista todas las migraciones
```

**Retorna:**
- Lista de archivos de migración
- Timestamp y nombre de cada migración
- Ruta del directorio

---

### 5. `supabase_read_migration`
Lee el contenido de un archivo de migración específico.

**Ejemplo:**
```
Lee la migración 20251105193026_be0a24e9-3082-4ede-b748-a27c45d89117.sql
```

**Parámetros:**
- `filename` (string): Nombre del archivo de migración

**Retorna:**
- Contenido completo del archivo SQL
- Número de líneas

---

### 6. `supabase_get_project_info`
Obtiene información del proyecto Supabase.

**Ejemplo:**
```
Muestra información del proyecto
```

**Retorna:**
- Project Ref
- URLs del dashboard
- Enlaces a Table Editor, SQL Editor, Auth, Storage

---

### 7. `supabase_cli_status`
Verifica el estado de Supabase CLI y servicios locales.

**Ejemplo:**
```
Verifica el estado de Supabase local
```

**Retorna:**
- Estado de servicios locales (si están corriendo)
- URLs de API, DB, Studio local
- Keys locales

**Nota:** Requiere tener Supabase CLI instalado y servicios iniciados con `supabase start`.

---

### 8. `supabase_cli_command`
Ejecuta un comando de Supabase CLI.

**Ejemplo:**
```
Ejecuta el comando: db diff
```

**Parámetros:**
- `command` (string): Comando CLI (sin el prefijo "supabase")

**Comandos útiles:**
- `db diff` - Ver diferencias entre local y remoto
- `migration list --linked` - Listar migraciones aplicadas
- `db pull` - Bajar esquema remoto
- `gen types typescript --linked` - Generar tipos TypeScript

**⚠️ Precaución:** Algunos comandos pueden modificar la base de datos.

---

### 9. `supabase_count_records`
Cuenta registros en una tabla con filtros opcionales.

**Ejemplo:**
```
Cuenta usuarios con rol admin
```

**Parámetros:**
- `tableName` (string): Nombre de la tabla
- `filters` (object, opcional): Filtros como pares clave-valor

**Ejemplo con filtros:**
```json
{
  "tableName": "user_roles",
  "filters": {
    "role": "admin"
  }
}
```

---

### 10. `supabase_get_rls_policies`
Obtiene las políticas RLS (Row Level Security) de una tabla.

**Ejemplo:**
```
Muestra las políticas RLS de la tabla profiles
```

**Parámetros:**
- `tableName` (string): Nombre de la tabla

**Retorna:**
- Lista de políticas con:
  - Nombre de la política
  - Comando (SELECT, INSERT, UPDATE, DELETE)
  - Roles aplicables
  - Condiciones (USING y WITH CHECK)

---

## 🔐 Seguridad

### Claves Utilizadas

El servidor MCP usa la **Anon Key** (pública) que:
- ✅ Es segura para uso en cliente
- ✅ Respeta todas las políticas RLS
- ✅ Solo permite operaciones autorizadas
- ❌ NO bypasea seguridad

### Limitaciones de Seguridad

1. **Solo SELECT queries**: Por seguridad, `supabase_query` solo permite SELECT
2. **RLS activo**: Todas las consultas respetan Row Level Security
3. **Sin Service Role**: No se usa la Service Role Key (que bypasea RLS)

### Para Operaciones Administrativas

Si necesitas operaciones que requieren Service Role:
1. Usa `supabase_cli_command` con comandos CLI
2. O conecta directamente con psql (ver docs/supabase-external-management.md)

---

## 📝 Ejemplos de Uso

### Explorar la Base de Datos

```
1. Lista todas las tablas
2. Describe la tabla reservations
3. Cuenta cuántas reservas hay para hoy
```

### Revisar Migraciones

```
1. Lista todas las migraciones
2. Lee la última migración
3. Ejecuta: db diff para ver cambios pendientes
```

### Verificar Datos

```
1. Cuenta usuarios activos
2. Muestra las últimas 10 reservas
3. Verifica políticas RLS de la tabla profiles
```

### Gestión de Proyecto

```
1. Muestra información del proyecto
2. Verifica estado de servicios locales
3. Genera tipos TypeScript actualizados
```

---

## 🐛 Troubleshooting

### "Supabase CLI might not be installed"

**Problema:** El comando `supabase_cli_status` falla.

**Solución:**
```bash
# Instalar Supabase CLI
brew install supabase/tap/supabase  # macOS
# O
npm install -g supabase             # NPM

# Verificar instalación
supabase --version
```

### "Query failed: function exec_sql does not exist"

**Problema:** La función RPC no existe en la base de datos.

**Solución:** El servidor intentará métodos alternativos automáticamente. Si persiste, algunas queries complejas pueden no funcionar. Usa `supabase_cli_command` con `db remote psql` para queries avanzadas.

### "Module not found: @modelcontextprotocol/sdk"

**Problema:** Dependencias no instaladas.

**Solución:**
```bash
cd .kiro/mcp-servers/supabase-reserveo
npm install
```

### El servidor no aparece en Kiro

**Solución:**
1. Verifica que `.kiro/settings/mcp.json` existe
2. Reinicia Kiro completamente
3. Abre la paleta de comandos → "MCP: Reconnect Servers"
4. Verifica logs en la vista "MCP Servers" del panel de Kiro

---

## 🔄 Actualizar el Servidor

Si modificas el código del servidor:

```bash
# 1. Editar index.js
# 2. Reconectar en Kiro
# Paleta de comandos → "MCP: Reconnect Servers"
```

No necesitas reinstalar dependencias a menos que cambies `package.json`.

---

## 📚 Recursos Adicionales

- **Documentación MCP**: https://modelcontextprotocol.io/
- **Supabase Docs**: https://supabase.com/docs
- **Guía de Supabase del Proyecto**: `docs/supabase-external-management.md`
- **Dashboard del Proyecto**: https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir

---

## 🎯 Próximos Pasos

1. **Instalar dependencias**: `cd .kiro/mcp-servers/supabase-reserveo && npm install`
2. **Reiniciar Kiro**: Para detectar el nuevo servidor
3. **Probar herramientas**: Pide a Kiro que liste las tablas o ejecute una query
4. **Explorar**: Usa las herramientas para gestionar tu proyecto Supabase

---

**Versión:** 1.0.0  
**Proyecto:** Reserveo  
**Supabase Project ID:** pevpefnemqvyygkrcwir  
**Última actualización:** 2025-11-11
