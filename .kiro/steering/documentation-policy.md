---
inclusion: always
---

# Política de Documentación - RESERVEO

## Siempre háblame en español

## Regla Principal

**❌ NO crear archivos de documentación automáticamente** después de completar tareas, a menos que el usuario lo solicite explícitamente.

## Qué NO hacer

- ❌ NO crear archivos `.md` de resumen después de cada cambio
- ❌ NO crear documentos de "implementation summary"
- ❌ NO crear archivos de "setup complete"
- ❌ NO documentar cada fix o mejora en un archivo separado
- ❌ NO crear "guides" o "reports" no solicitados

## Qué SÍ hacer

- ✅ Responder verbalmente con un resumen conciso (2-3 frases máximo)
- ✅ Actualizar steering files existentes cuando sea relevante
- ✅ Crear documentación SOLO cuando el usuario lo pida explícitamente
- ✅ Mantener el README.md actualizado con cambios importantes

## Ejemplos

### ❌ INCORRECTO
```
Usuario: "Arregla el bug de las fotos"
Kiro: [Arregla el bug]
Kiro: [Crea docs/PHOTO-BUG-FIX.md]
Kiro: [Crea docs/PHOTO-IMPLEMENTATION-GUIDE.md]
```

### ✅ CORRECTO
```
Usuario: "Arregla el bug de las fotos"
Kiro: [Arregla el bug]
Kiro: "Arreglado. Las fotos ahora se suben como ArrayBuffer para evitar el bug de Content-Type de Supabase."
```

### ✅ CORRECTO (con solicitud explícita)
```
Usuario: "Arregla el bug de las fotos y documéntalo"
Kiro: [Arregla el bug]
Kiro: [Crea docs/photo-fix-guide.md]
Kiro: "Arreglado y documentado en docs/photo-fix-guide.md"
```

## Resúmenes Verbales

Cuando termines una tarea, usa un resumen **muy breve**:

- ✅ "Arreglado. [1 frase explicando qué se hizo]"
- ✅ "Implementado. [1 frase sobre el resultado]"
- ❌ NO usar listas de bullets extensas
- ❌ NO repetir todo lo que se hizo paso a paso
- ❌ NO crear secciones de "Archivos modificados", "Cambios realizados", etc.

## Excepciones

Crear documentación automáticamente SOLO en estos casos:

1. **Migraciones de base de datos**: Comentarios en el archivo SQL
2. **Steering files**: Actualizar cuando sea relevante para futuras tareas
3. **README.md**: Actualizar con cambios arquitectónicos importantes
4. **Solicitud explícita del usuario**: "documenta esto", "crea una guía", etc.

## Carpeta docs/

La carpeta `docs/` debe mantenerse limpia. Solo debe contener:

- Documentación arquitectónica importante
- Guías de setup iniciales
- Documentación solicitada explícitamente por el usuario

**NO llenar con**:
- Reportes de cada bug fix
- Summaries de cada feature
- Guides de cada implementación
- Logs de cambios detallados
