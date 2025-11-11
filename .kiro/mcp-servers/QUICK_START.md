# 🚀 Guía Rápida - MCP Server de Supabase

## ✅ Instalación Completada

El servidor MCP de Supabase para Reserveo ha sido instalado correctamente.

---

## 📋 Próximos Pasos

### 1. Reiniciar Kiro

Para que Kiro detecte el nuevo servidor MCP, necesitas:

**Opción A: Reconectar Servidores (Rápido)**
1. Abre la paleta de comandos: `Cmd/Ctrl + Shift + P`
2. Busca: `MCP: Reconnect Servers`
3. Presiona Enter

**Opción B: Reiniciar Kiro (Completo)**
1. Cierra Kiro completamente
2. Vuelve a abrir Kiro
3. El servidor se cargará automáticamente

---

## 🧪 Probar el Servidor

Una vez reiniciado Kiro, prueba con estos comandos:

### Test 1: Listar Tablas
```
Lista todas las tablas de la base de datos
```

**Resultado esperado:** Lista de tablas como `profiles`, `reservations`, `parking_spots`, etc.

### Test 2: Información del Proyecto
```
Muestra información del proyecto Supabase
```

**Resultado esperado:** URLs del dashboard, project ref, enlaces útiles.

### Test 3: Consulta Simple
```
Muestra los últimos 5 usuarios registrados
```

**Resultado esperado:** Lista de usuarios con email y fecha de creación.

---

## 🛠️ Herramientas Disponibles

El servidor MCP proporciona 10 herramientas:

| Herramienta | Descripción | Ejemplo |
|-------------|-------------|---------|
| `supabase_query` | Ejecutar consultas SQL SELECT | "Muestra todas las reservas de hoy" |
| `supabase_list_tables` | Listar todas las tablas | "Lista las tablas" |
| `supabase_describe_table` | Describir estructura de tabla | "Describe la tabla profiles" |
| `supabase_list_migrations` | Listar migraciones | "Lista las migraciones" |
| `supabase_read_migration` | Leer archivo de migración | "Lee la última migración" |
| `supabase_get_project_info` | Info del proyecto | "Info del proyecto" |
| `supabase_cli_status` | Estado de CLI local | "Estado de Supabase local" |
| `supabase_cli_command` | Ejecutar comando CLI | "Ejecuta: db diff" |
| `supabase_count_records` | Contar registros | "Cuántos usuarios hay" |
| `supabase_get_rls_policies` | Ver políticas RLS | "Políticas de profiles" |

---

## 💡 Ejemplos de Uso Práctico

### Exploración de Datos

```
1. ¿Cuántas reservas hay en total?
2. Muestra las últimas 10 reservas
3. ¿Cuántos usuarios tienen rol de admin?
4. Lista todos los grupos de parking activos
```

### Análisis de Estructura

```
1. Describe la tabla reservations
2. ¿Qué políticas RLS tiene la tabla profiles?
3. Lista todas las migraciones aplicadas
4. Muestra la estructura de la tabla parking_spots
```

### Gestión de Migraciones

```
1. Lista todas las migraciones
2. Lee la migración más reciente
3. Ejecuta: db diff para ver cambios pendientes
4. Ejecuta: migration list --linked
```

### Verificación de Datos

```
1. ¿Cuántas plazas de parking hay en total?
2. ¿Cuántas matrículas están pendientes de aprobación?
3. Muestra los usuarios bloqueados
4. Lista las fechas bloqueadas para reservas
```

---

## 🔍 Verificar que Funciona

### Método 1: Vista de MCP Servers

1. Abre el panel lateral de Kiro
2. Busca la sección "MCP Servers"
3. Deberías ver: `supabase-reserveo` con estado "Connected"

### Método 2: Comando de Prueba

Simplemente pregunta a Kiro:
```
¿Está funcionando el servidor MCP de Supabase?
```

Kiro debería poder usar las herramientas para responder.

---

## 🐛 Solución de Problemas

### El servidor no aparece

**Solución:**
1. Verifica que `.kiro/settings/mcp.json` existe
2. Reinicia Kiro completamente (no solo reconectar)
3. Revisa los logs en la vista "MCP Servers"

### "Module not found" error

**Solución:**
```bash
cd .kiro/mcp-servers/supabase-reserveo
npm install
```

### Las queries no funcionan

**Posible causa:** La función RPC `exec_sql` no existe en la base de datos.

**Solución temporal:** Usa herramientas alternativas como:
- `supabase_list_tables`
- `supabase_describe_table`
- `supabase_count_records`
- `supabase_cli_command` con `db remote psql`

---

## 📚 Documentación Completa

Para más detalles, consulta:
- **README del servidor**: `.kiro/mcp-servers/supabase-reserveo/README.md`
- **Guía de Supabase**: `docs/supabase-external-management.md`
- **Documentación MCP**: https://modelcontextprotocol.io/

---

## 🎯 Casos de Uso Recomendados

### Para Desarrollo

- Explorar estructura de tablas antes de escribir código
- Verificar datos de prueba
- Contar registros para validar operaciones
- Revisar políticas RLS

### Para Debugging

- Consultar datos específicos sin abrir el dashboard
- Verificar estado de migraciones
- Revisar logs de cancelaciones
- Analizar relaciones entre tablas

### Para Administración

- Ejecutar comandos CLI sin salir de Kiro
- Generar tipos TypeScript actualizados
- Verificar diferencias entre local y remoto
- Gestionar migraciones

---

## ✨ Ventajas del MCP Server

1. **Acceso Directo**: Consulta la base de datos sin salir de Kiro
2. **Contexto Completo**: Kiro entiende tu esquema de base de datos
3. **Automatización**: Ejecuta comandos CLI automáticamente
4. **Seguridad**: Usa Anon Key (respeta RLS)
5. **Productividad**: Menos cambios de contexto

---

## 🔄 Próximas Mejoras (Opcional)

Si quieres extender el servidor MCP, puedes agregar:

- Herramienta para crear migraciones
- Herramienta para aplicar migraciones
- Herramienta para backup de datos
- Herramienta para generar tipos TypeScript
- Herramienta para ver logs de auth
- Herramienta para gestionar storage

Edita `.kiro/mcp-servers/supabase-reserveo/index.js` y agrega nuevas herramientas.

---

**¡Listo para usar!** 🎉

Reinicia Kiro y empieza a usar el servidor MCP de Supabase.

---

**Versión:** 1.0.0  
**Fecha:** 2025-11-11  
**Proyecto:** Reserveo
