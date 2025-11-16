# 🎣 Agent Hooks - RESERVEO

Hooks automáticos y manuales para mantener el proyecto actualizado y bien documentado.

## 📋 Hooks Disponibles

### 🔄 Sincronizar Documentación (MANUAL)
**Archivo:** `sync-docs.kiro.hook`  
**Cuándo:** Después de completar features o cambios importantes

Mantiene actualizados los steering files y README con los cambios del proyecto.

**Uso:**
1. Panel "Agent Hooks" → "Sincronizar Documentación" → Run
2. O Command Palette → "Kiro: Run Hook" → "Sincronizar Documentación"

---

### 🧪 Actualizar Tests K6 (MANUAL)
**Archivo:** `update-k6-tests.kiro.hook`  
**Cuándo:** Después de aplicar migraciones con nuevas funciones/endpoints

Detecta gaps en cobertura de tests y ayuda a crear tests K6 necesarios.

**Uso:**
1. Aplica migraciones: `supabase db push`
2. Panel "Agent Hooks" → "Actualizar Tests K6" → Run
3. Revisa sugerencias y crea tests

---

### 📊 Auditoría Completa (MANUAL)
**Archivo:** `full-audit.kiro.hook`  
**Cuándo:** Mensualmente o antes de releases

Auditoría exhaustiva del proyecto: BD, código, tests y documentación.

**Uso:**
1. Panel "Agent Hooks" → "Auditoría Completa" → Run
2. Espera el reporte completo (2-3 minutos)
3. Ejecuta acciones recomendadas

---

### ⚠️ Verificador de Migraciones (AUTOMÁTICO)
**Archivo:** `migration-watcher.kiro.hook`  
**Trigger:** Save de archivo en `supabase/migrations/*.sql`  
**Cooldown:** Implementado en el prompt

Aviso discreto cuando guardas migraciones significativas.

**Comportamiento:**
- Solo avisa si detecta cambios importantes (tabla/función nueva)
- No interrumpe el trabajo
- No se repite si ya avisó en la última hora
- Puede deshabilitarse si resulta molesto

---

## 🚀 Cómo Acceder a los Hooks

### Opción 1: Panel de Agent Hooks
1. Abre el panel lateral de Kiro
2. Busca la sección "Agent Hooks"
3. Verás la lista de hooks disponibles
4. Click en "Run" para ejecutar un hook manual

### Opción 2: Command Palette
1. Abre Command Palette (Cmd/Ctrl + Shift + P)
2. Escribe "Kiro: Run Hook"
3. Selecciona el hook que quieres ejecutar

### Opción 3: Búsqueda
1. Abre Command Palette
2. Escribe "Open Kiro Hook UI"
3. Explora y ejecuta hooks desde la interfaz

---

## 📅 Frecuencia Recomendada

| Hook | Frecuencia | Momento Ideal |
|------|-----------|---------------|
| Sync Docs | Semanal | Después de completar features |
| Update K6 Tests | Por migración | Después de `supabase db push` |
| Full Audit | Mensual | Inicio de mes o antes de release |
| Migration Watcher | Automático | Se activa solo |

---

## ⚙️ Configuración

### Deshabilitar Hook Automático

Si el "Verificador de Migraciones" resulta molesto:

1. **Opción A:** Panel de Agent Hooks → "Verificador de Migraciones" → Disable
2. **Opción B:** Eliminar archivo `.kiro/hooks/migration-watcher.kiro.hook`

### Modificar Hooks

Los hooks son archivos JSON (`.kiro.hook`) con configuración y prompts. Puedes:
- Editar el campo `prompt` para ajustar comportamiento
- Cambiar el `type` en `when` (userTriggered, fileEdit, fileCreate, fileDelete)
- Modificar `patterns` para cambiar qué archivos activan el hook
- Añadir reglas específicas en el prompt

---

## 🎯 Workflow Recomendado

### Durante Desarrollo
1. Desarrollas feature → Guardas archivos
2. (Opcional) Hook automático te avisa si hay migración importante
3. Continúas trabajando sin interrupciones

### Al Completar Feature
1. Feature terminada → Click en "Sync Docs"
2. Revisas sugerencias → Confirmas cambios
3. Documentación actualizada ✅

### Después de Migraciones
1. Aplicas migraciones → `supabase db push`
2. Click en "Update K6 Tests"
3. Creas tests sugeridos
4. Tests actualizados ✅

### Mantenimiento Mensual
1. Inicio de mes → Click en "Full Audit"
2. Revisas reporte completo
3. Ejecutas acciones recomendadas
4. Proyecto auditado ✅

---

## 🛠️ Troubleshooting

### Hook no aparece en el panel
- Verifica que el archivo `.kiro.hook` esté en `.kiro/hooks/`
- Reinicia Kiro o recarga la ventana (Cmd/Ctrl + R)
- Verifica que el JSON sea válido
- Verifica que tenga los campos requeridos: name, description, when, then

### Hook se ejecuta pero no hace nada
- Revisa el output del agente en el chat
- Verifica que tengas permisos de escritura
- Verifica que los archivos a actualizar existan

### Hook automático es muy molesto
- Desactívalo desde el panel de Agent Hooks
- O elimina el archivo `migration-watcher.md`
- Los hooks manuales son más importantes

### Hook tarda mucho
- "Full Audit" puede tardar 2-3 minutos (es normal)
- Otros hooks deberían ser rápidos (< 30 segundos)
- Si tarda más, puede haber problema de conexión con MCP

---

## 📚 Más Información

- **Documentación de Hooks:** Ver system prompt de Kiro
- **Steering Files:** `.kiro/steering/` - Documentación del proyecto
- **Specs:** `.kiro/specs/` - Features planificadas/completadas
- **Tests K6:** `tests/k6/` - Tests de carga

---

## 🤝 Contribuir

Si creas hooks útiles para el proyecto:
1. Añádelos a `.kiro/hooks/`
2. Documéntalos en este README
3. Comparte con el equipo

---

**Última actualización:** 2025-11-16  
**Versión:** 1.0.0
