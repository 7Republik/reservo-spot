---
inclusion: manual
---

# RESERVEO - Agent Hooks

## Siempre háblame en español

## Overview

Sistema de hooks automáticos y manuales para mantener el proyecto actualizado sin esfuerzo manual constante.

**Ubicación:** `.kiro/hooks/`  
**Total de hooks:** 4 (3 manuales + 1 automático)

## Filosofía de los Hooks

### Principios de Diseño
1. ✅ **Hooks manuales para acciones importantes** - Control total del usuario
2. ✅ **Hooks automáticos discretos** - Solo avisos, no acciones
3. ✅ **No intrusivos** - No interrumpen el flujo de trabajo
4. ✅ **Cooldown period** - No molestar repetidamente
5. ✅ **Mensajes concisos** - Máximo 2-3 líneas

### Qué NO hacen los hooks
- ❌ NO crean documentación nueva sin permiso
- ❌ NO modifican archivos sin confirmación
- ❌ NO interrumpen el trabajo del usuario
- ❌ NO se ejecutan en cada save (solo el watcher, con cooldown)
- ❌ NO son obligatorios (pueden deshabilitarse)

## Hooks Disponibles

### 1. 🔄 Sincronizar Documentación (MANUAL)

**Archivo:** `sync-docs.md`  
**Tipo:** Manual (Botón)  
**Propósito:** Mantener steering files y README actualizados

**Qué hace:**
1. Consulta BD con MCP para obtener estado actual (tablas, funciones, triggers)
2. Revisa archivos recientes (componentes, hooks, migraciones, tests)
3. Identifica features completadas en specs
4. Compara con documentación actual
5. Muestra resumen conciso de cambios (máx 10 líneas)
6. Pregunta qué archivos actualizar
7. Aplica solo cambios confirmados

**Archivos que puede actualizar:**
- `.kiro/steering/tech.md` - Números de BD, stack técnico
- `.kiro/steering/structure.md` - Componentes y hooks nuevos
- `.kiro/steering/product.md` - Features completadas
- `README.md` - Documentación principal

**Cuándo usar:**
- Después de completar una feature importante
- Después de aplicar varias migraciones
- Antes de hacer un release
- Mensualmente como mantenimiento

**Frecuencia recomendada:** Semanal o después de features

---

### 2. 🧪 Actualizar Tests K6 (MANUAL)

**Archivo:** `update-k6-tests.md`  
**Tipo:** Manual (Botón)  
**Propósito:** Mantener tests de carga actualizados con cambios en API

**Qué hace:**
1. Lee últimas 5 migraciones en `supabase/migrations/`
2. Identifica cambios significativos (tablas, funciones públicas, endpoints)
3. Lista tests existentes en `tests/k6/`
4. Detecta gaps en cobertura
5. Sugiere tests necesarios con ejemplos de código
6. Pregunta qué tests crear/actualizar
7. Crea tests confirmados siguiendo patrones del proyecto

**Archivos que puede crear/actualizar:**
- `tests/k6/new-feature-test.js` - Nuevos tests
- `.env.k6` - Variables de configuración
- `tests/k6/README.md` - Documentación de tests
- `package.json` - Comandos npm para tests

**Cuándo usar:**
- Después de aplicar migraciones con nuevas funciones públicas
- Después de añadir nuevos endpoints a la API
- Cuando detectes gaps en cobertura
- Antes de releases importantes

**Frecuencia recomendada:** Por migración significativa

---

### 3. 📊 Auditoría Completa (MANUAL)

**Archivo:** `full-audit.md`  
**Tipo:** Manual (Botón)  
**Propósito:** Auditoría exhaustiva del proyecto completo

**Qué hace:**
1. **Audita Base de Datos:**
   - Cuenta tablas, funciones, triggers, RLS policies
   - Compara con documentación
   - Detecta elementos no documentados

2. **Audita Código:**
   - Cuenta componentes, hooks, páginas
   - Verifica estructura vs documentación
   - Detecta archivos huérfanos

3. **Audita Tests:**
   - Verifica cobertura de tests K6
   - Detecta funcionalidades sin tests
   - Calcula % de cobertura

4. **Audita Documentación:**
   - Verifica steering files vs realidad
   - Verifica README vs features
   - Detecta documentación obsoleta

5. **Audita Specs:**
   - Lista specs completadas
   - Verifica si están en product.md y README
   - Detecta specs abandonadas

6. **Genera Reporte:**
   - Resumen ejecutivo con puntuación
   - Hallazgos principales
   - Recomendaciones priorizadas
   - Métricas y próximos pasos

**Cuándo usar:**
- Mensualmente para proyectos en desarrollo activo
- Trimestralmente para proyectos en mantenimiento
- Antes de releases importantes
- Después de cambios grandes

**Frecuencia recomendada:** Mensual

---

### 4. ⚠️ Verificador de Migraciones (AUTOMÁTICO)

**Archivo:** `migration-watcher.md`  
**Tipo:** Automático (Trigger en save)  
**Propósito:** Recordatorio discreto para actualizar documentación

**Trigger:** Save de archivo en `supabase/migrations/*.sql`  
**Cooldown:** 1 hora (no molesta si ya avisó)

**Qué hace:**
1. Detecta save de migración
2. Lee contenido de la migración
3. Analiza si es cambio significativo:
   - ✅ Nueva tabla pública
   - ✅ Nueva función pública
   - ✅ Cambio en estructura de API
   - ✅ Nuevo storage bucket
   - ❌ Solo RLS policies (no significativo)
   - ❌ Solo índices (no significativo)
4. Si es significativo Y no avisó en última hora:
   - Muestra mensaje discreto (1-2 líneas)
   - No interrumpe trabajo
   - No requiere acción inmediata

**Mensaje típico:**
```
💡 Nueva migración con cambios significativos detectada.
   Considera ejecutar "Sync Docs" y "Update K6 Tests" cuando termines.
```

**Puede deshabilitarse:** Sí, si resulta molesto

**Frecuencia:** Automático (con cooldown de 1 hora)

---

## Cómo Usar los Hooks

### Acceso a Hooks

**Opción 1: Panel de Agent Hooks**
1. Abre panel lateral de Kiro
2. Sección "Agent Hooks"
3. Click en "Run" para ejecutar

**Opción 2: Command Palette**
1. Cmd/Ctrl + Shift + P
2. "Kiro: Run Hook"
3. Selecciona hook

**Opción 3: Búsqueda**
1. Command Palette
2. "Open Kiro Hook UI"
3. Explora y ejecuta

### Workflow Recomendado

**Durante Desarrollo:**
```
Desarrollas → Guardas → (Hook automático avisa si es importante) → Continúas
```

**Al Completar Feature:**
```
Feature terminada → "Sync Docs" → Revisas → Confirmas → Documentación actualizada ✅
```

**Después de Migraciones:**
```
supabase db push → "Update K6 Tests" → Revisas → Creas tests → Tests actualizados ✅
```

**Mantenimiento Mensual:**
```
Inicio de mes → "Full Audit" → Revisas reporte → Ejecutas acciones → Proyecto auditado ✅
```

## Configuración de Hooks

### Estructura de un Hook

Los hooks son archivos Markdown en `.kiro/hooks/` con:
1. **Metadata:** Tipo, trigger, propósito
2. **Objetivo:** Qué hace el hook
3. **Prompt:** Instrucciones detalladas para el agente
4. **Uso:** Cómo ejecutarlo
5. **Frecuencia:** Cuándo usarlo

### Modificar Hooks

Puedes editar los archivos `.md` para:
- Ajustar comportamiento del agente
- Cambiar reglas específicas
- Añadir validaciones
- Modificar formato de output

### Deshabilitar Hooks

**Hook automático:**
- Panel "Agent Hooks" → "Verificador de Migraciones" → Disable
- O eliminar archivo `migration-watcher.md`

**Hooks manuales:**
- No es necesario deshabilitarlos (solo se ejecutan cuando los llamas)
- Puedes eliminar el archivo si no los usas

## Integración con Steering Files

Los hooks están diseñados para mantener actualizados estos steering files:

| Steering File | Hook que lo actualiza | Frecuencia |
|---------------|----------------------|------------|
| `tech.md` | Sync Docs | Semanal |
| `structure.md` | Sync Docs | Semanal |
| `product.md` | Sync Docs | Por feature |
| `supabase.md` | Sync Docs | Por migración |
| `README.md` | Sync Docs | Por feature |

## Integración con Tests K6

Los hooks ayudan a mantener tests actualizados:

| Acción | Hook | Resultado |
|--------|------|-----------|
| Nueva función SQL | Update K6 Tests | Sugiere test nuevo |
| Nueva tabla | Update K6 Tests | Sugiere test CRUD |
| Cambio en API | Update K6 Tests | Sugiere actualizar test |
| Gap detectado | Full Audit | Lista en reporte |

## Troubleshooting

### Hook no aparece
- Verifica archivo en `.kiro/hooks/`
- Reinicia Kiro
- Verifica formato Markdown

### Hook no hace nada
- Revisa output en chat
- Verifica permisos de escritura
- Verifica que archivos existan

### Hook muy lento
- "Full Audit" tarda 2-3 min (normal)
- Otros < 30 seg
- Si tarda más, problema de conexión MCP

### Hook muy molesto
- Desactiva hook automático
- Ajusta cooldown en el archivo
- Elimina archivo si no lo usas

## Mejores Prácticas

### DO ✅
- Ejecutar "Sync Docs" después de features
- Ejecutar "Update K6 Tests" después de migraciones
- Ejecutar "Full Audit" mensualmente
- Revisar sugerencias antes de aplicar
- Mantener hooks actualizados con el proyecto

### DON'T ❌
- No ejecutar hooks sin revisar output
- No aplicar cambios sin confirmar
- No ignorar avisos del hook automático
- No modificar hooks sin entender el prompt
- No depender 100% de hooks (revisar manualmente también)

## Limitaciones

### Qué pueden hacer los hooks
- ✅ Detectar cambios en archivos
- ✅ Consultar base de datos con MCP
- ✅ Analizar código y estructura
- ✅ Sugerir actualizaciones
- ✅ Actualizar archivos con confirmación

### Qué NO pueden hacer los hooks
- ❌ Detectar cambios aplicados fuera del IDE
- ❌ Saber si una feature está "realmente" completa
- ❌ Ejecutar tests automáticamente
- ❌ Hacer commits de Git
- ❌ Desplegar a producción

## Referencias

- **Documentación de Hooks:** Ver system prompt de Kiro
- **Archivos de Hooks:** `.kiro/hooks/`
- **README de Hooks:** `.kiro/hooks/README.md`
- **Steering Files:** `.kiro/steering/`

