# Guía de Gestión de Incidentes para Administradores

## Índice
1. [Introducción](#introducción)
2. [Acceso al Panel de Incidentes](#acceso-al-panel-de-incidentes)
3. [Vista General de Incidentes](#vista-general-de-incidentes)
4. [Revisión de Incidentes](#revisión-de-incidentes)
5. [Confirmación de Incidentes](#confirmación-de-incidentes)
6. [Desestimación de Incidentes](#desestimación-de-incidentes)
7. [Sistema de Amonestaciones](#sistema-de-amonestaciones)
8. [Grupos de Reserva para Incidentes](#grupos-de-reserva-para-incidentes)
9. [Mejores Prácticas](#mejores-prácticas)
10. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

El sistema de gestión de incidentes permite a los administradores revisar y resolver reportes de plazas ocupadas indebidamente. Cuando un usuario llega a su plaza reservada y la encuentra ocupada, puede reportar el incidente con evidencia fotográfica y la matrícula del vehículo infractor.

### ¿Qué hace el sistema automáticamente?

Cuando un usuario reporta un incidente:
1. ✅ Captura foto de evidencia y matrícula del infractor
2. ✅ Busca automáticamente una plaza alternativa disponible
3. ✅ Crea una nueva reserva para el usuario afectado
4. ✅ Registra el incidente como "Pendiente" para revisión administrativa

### ¿Qué debe hacer el administrador?

El administrador debe:
1. 📋 Revisar la evidencia fotográfica y los detalles del incidente
2. ✅ Confirmar el incidente si es válido (emite amonestación y cancela reserva del infractor)
3. ❌ Desestimar el incidente si no procede (sin consecuencias para el infractor)

---

## Acceso al Panel de Incidentes

### Navegación

1. Inicia sesión con tu cuenta de administrador
2. En el panel de administración, haz clic en la pestaña **"Incidentes"**
3. Verás la lista de todos los incidentes reportados

### Indicador de Incidentes Pendientes

- El icono de "Incidentes" muestra un **badge numérico** con la cantidad de incidentes pendientes de revisión
- Este contador se actualiza automáticamente cuando se resuelven incidentes

---

## Vista General de Incidentes

### Filtros Disponibles

La lista de incidentes se puede filtrar por estado:

- **Todos**: Muestra todos los incidentes sin filtro
- **Pendientes**: Solo incidentes que requieren revisión (estado por defecto)
- **Confirmados**: Incidentes validados con amonestación emitida
- **Desestimados**: Incidentes cerrados sin acción disciplinaria

### Información Mostrada

Cada incidente en la lista muestra:

| Campo | Descripción |
|-------|-------------|
| **Fecha** | Fecha y hora del reporte |
| **Usuario Afectado** | Nombre del usuario que reportó el incidente |
| **Plaza Original** | Plaza que estaba reservada y fue ocupada |
| **Plaza Reasignada** | Nueva plaza asignada automáticamente |
| **Infractor** | Usuario identificado (si la matrícula está registrada) |
| **Estado** | Pendiente / Confirmado / Desestimado |
| **Amonestaciones** | Número de amonestaciones del infractor (si aplica) |

### Búsqueda y Ordenación

- **Búsqueda**: Busca por nombre de usuario o matrícula
- **Ordenación**: Los incidentes se muestran del más reciente al más antiguo
- **Destacado**: Los incidentes pendientes se resaltan visualmente

---

## Revisión de Incidentes

### Abrir Detalles del Incidente

1. Haz clic en cualquier incidente de la lista
2. Se abrirá un panel lateral o modal con todos los detalles

### Información Detallada

El panel de detalles muestra:

#### 1. Información del Usuario Afectado
- Nombre completo
- Email
- Fecha y hora del reporte

#### 2. Detalles de la Plaza Original
- Número de plaza
- Grupo de aparcamiento
- Fecha de la reserva

#### 3. Detalles de la Plaza Reasignada
- Número de plaza alternativa
- Grupo de aparcamiento
- Estado de la nueva reserva

#### 4. Información del Infractor
- Nombre completo (si se identificó)
- Email
- Matrícula del vehículo
- **Historial de amonestaciones** (número total)
- Enlace al perfil del usuario

#### 5. Evidencia Fotográfica
- Foto capturada por el usuario
- Clic para ver en tamaño completo
- Descarga disponible

#### 6. Notas Administrativas
- Campo editable para añadir observaciones
- Se guarda automáticamente
- Visible para todos los administradores

---

## Confirmación de Incidentes

### ¿Cuándo confirmar un incidente?

Confirma un incidente cuando:
- ✅ La foto muestra claramente un vehículo ocupando la plaza reservada
- ✅ La matrícula coincide con la del vehículo en la foto
- ✅ El usuario afectado tenía una reserva válida para esa plaza y fecha
- ✅ No hay circunstancias atenuantes (emergencia, error del sistema, etc.)

### Proceso de Confirmación

1. Revisa toda la información y evidencia
2. Haz clic en el botón **"Confirmar Incidente"**
3. Aparecerá un diálogo de confirmación mostrando las consecuencias:
   - Se emitirá una amonestación al infractor
   - Se cancelará la reserva del infractor para esa fecha
   - El incidente se marcará como "Confirmado"
4. Confirma la acción

### ¿Qué sucede al confirmar?

El sistema ejecuta automáticamente las siguientes acciones:

1. **Actualiza el estado del incidente** a "Confirmado"
2. **Emite una amonestación** al usuario infractor
   - Se crea un registro en la tabla `user_warnings`
   - Motivo: "Ocupó la plaza reservada de otro usuario"
   - Se vincula al incidente específico
3. **Cancela la reserva del infractor** para esa fecha
   - La reserva se marca como "Cancelada"
   - Se registra en el log de cancelaciones
   - Motivo: "Incidente confirmado: ocupó plaza reservada"
4. **Registra el administrador** que confirmó el incidente
5. **Marca la fecha y hora** de confirmación

### Notificaciones

- El usuario infractor recibirá una notificación (si está configurado)
- El contador de amonestaciones del usuario se incrementa
- El incidente desaparece de la lista de "Pendientes"

---

## Desestimación de Incidentes

### ¿Cuándo desestimar un incidente?

Desestima un incidente cuando:
- ❌ La evidencia fotográfica no es clara o no muestra la infracción
- ❌ La matrícula no coincide con el vehículo en la foto
- ❌ Hay circunstancias atenuantes (emergencia médica, error del sistema)
- ❌ El usuario afectado no tenía una reserva válida
- ❌ Se trata de un error o malentendido

### Proceso de Desestimación

1. Revisa toda la información y evidencia
2. Haz clic en el botón **"Desestimar Incidente"**
3. Aparecerá un diálogo solicitando el motivo de la desestimación
4. Escribe una breve explicación (opcional pero recomendado)
5. Confirma la acción

### ¿Qué sucede al desestimar?

El sistema ejecuta las siguientes acciones:

1. **Actualiza el estado del incidente** a "Desestimado"
2. **NO se emite amonestación** al usuario identificado
3. **NO se cancela ninguna reserva**
4. **Guarda el motivo** en las notas administrativas
5. El incidente se archiva y desaparece de la lista de "Pendientes"

---

## Sistema de Amonestaciones

### ¿Qué es una amonestación?

Una amonestación es un registro disciplinario que se emite a un usuario por violar las normas de aparcamiento. Se crea automáticamente al confirmar un incidente.

### Información de la Amonestación

Cada amonestación contiene:
- **Usuario**: A quién se emitió
- **Incidente**: Incidente que la originó (con enlace)
- **Fecha**: Cuándo se emitió
- **Motivo**: "Ocupó la plaza reservada de otro usuario"
- **Administrador**: Quién la emitió
- **Notas**: Observaciones adicionales (opcional)

### Visualización del Historial

El historial de amonestaciones de un usuario se puede ver en:

1. **Panel de detalles del incidente**: Muestra el contador total
2. **Perfil del usuario** (en la sección de Usuarios): Lista completa de amonestaciones
3. **Lista de incidentes**: Badge con el número de amonestaciones

### Acciones Basadas en Amonestaciones

Aunque el sistema no toma acciones automáticas, los administradores pueden:

- **Identificar reincidentes**: Usuarios con múltiples amonestaciones
- **Tomar medidas escaladas**:
  - 1-2 amonestaciones: Advertencia verbal
  - 3-4 amonestaciones: Suspensión temporal
  - 5+ amonestaciones: Bloqueo permanente o revocación de privilegios

### Consulta de Amonestaciones

Para ver todas las amonestaciones de un usuario:

1. Ve a la pestaña **"Usuarios"** en el panel de administración
2. Busca al usuario
3. Haz clic en su tarjeta para ver el perfil
4. La sección de amonestaciones muestra el historial completo

---

## Grupos de Reserva para Incidentes

### ¿Qué son los Grupos de Reserva para Incidentes?

Son grupos de aparcamiento especiales designados como **última opción** para reasignaciones automáticas cuando un usuario reporta un incidente.

### Lógica de Prioridad

Cuando un usuario reporta un incidente, el sistema busca plazas disponibles en este orden:

1. **Prioridad 1**: Grupos generales (donde el usuario tiene acceso)
2. **Prioridad 2**: Grupos de reserva para incidentes (solo si no hay plazas en grupos generales)

### Configuración

Para designar un grupo como "Reserva para Incidentes":

1. Ve a la pestaña **"Grupos"** en el panel de administración
2. Edita el grupo que deseas configurar
3. Activa el checkbox **"Grupo de reserva para incidentes"**
4. Guarda los cambios

### Indicador Visual

Los grupos de reserva para incidentes se muestran con un icono especial (🚨) en la lista de grupos.

### Recomendaciones

- **Cantidad**: Designa 1-2 grupos pequeños como reserva
- **Ubicación**: Preferiblemente en zonas menos convenientes
- **Capacidad**: 5-10% del total de plazas
- **Acceso**: Asegúrate de que todos los usuarios tengan acceso a estos grupos

### Ejemplo de Configuración

```
Grupos Generales (Prioridad 1):
- Planta -1 (50 plazas) ✅
- Planta -2 (40 plazas) ✅
- Zona Norte (30 plazas) ✅

Grupos de Reserva para Incidentes (Prioridad 2):
- Reserva Incidentes (10 plazas) 🚨
```

---

## Mejores Prácticas

### Revisión de Incidentes

1. **Revisa diariamente**: Establece un horario para revisar incidentes pendientes
2. **Prioriza por fecha**: Atiende primero los incidentes más recientes
3. **Verifica la evidencia**: Siempre revisa la foto antes de tomar una decisión
4. **Documenta**: Añade notas administrativas explicando tu decisión
5. **Sé consistente**: Aplica los mismos criterios a todos los casos

### Gestión de Amonestaciones

1. **Seguimiento**: Revisa periódicamente usuarios con múltiples amonestaciones
2. **Comunicación**: Contacta a usuarios reincidentes para advertirles
3. **Escalamiento**: Define una política clara de consecuencias por amonestaciones
4. **Registro**: Documenta todas las acciones tomadas con usuarios problemáticos

### Configuración de Grupos de Reserva

1. **Monitoreo**: Revisa el uso de grupos de reserva para incidentes
2. **Ajuste**: Si se usan frecuentemente, considera aumentar la capacidad
3. **Equilibrio**: Mantén un balance entre disponibilidad general y reserva
4. **Comunicación**: Informa a los usuarios sobre la existencia de estos grupos

### Comunicación con Usuarios

1. **Transparencia**: Explica claramente el proceso de gestión de incidentes
2. **Feedback**: Proporciona retroalimentación a usuarios que reportan incidentes
3. **Educación**: Usa los incidentes como oportunidad para educar sobre las normas
4. **Reconocimiento**: Agradece a usuarios que reportan correctamente

---

## Preguntas Frecuentes

### ¿Qué pasa si no se identifica al infractor?

Si la matrícula no está registrada en el sistema:
- El incidente se registra sin identificar al infractor
- El usuario afectado aún recibe su plaza reasignada
- El administrador puede investigar manualmente y añadir notas
- No se puede emitir amonestación automática

**Acción recomendada**: Investiga manualmente usando la foto y la matrícula, luego añade notas al incidente.

### ¿Qué pasa si no hay plazas disponibles?

Si no hay plazas disponibles en ningún grupo:
- El incidente se registra de todas formas
- El usuario recibe un mensaje indicando que no hay plazas
- El incidente se marca como "Sin reasignación"
- El administrador recibe una notificación prioritaria

**Acción recomendada**: Contacta al usuario afectado para buscar una solución alternativa.

### ¿Puedo revertir una confirmación?

No, las confirmaciones de incidentes son **irreversibles** por diseño para mantener la integridad del sistema de amonestaciones.

**Acción recomendada**: Si confirmaste un incidente por error:
1. Añade una nota administrativa explicando el error
2. Contacta al usuario afectado para disculparte
3. Considera eliminar manualmente la amonestación (requiere acceso a base de datos)

### ¿Puedo editar un incidente después de resolverlo?

Puedes:
- ✅ Añadir o editar notas administrativas en cualquier momento
- ❌ No puedes cambiar el estado (confirmado/desestimado)
- ❌ No puedes eliminar amonestaciones emitidas

### ¿Cómo manejo incidentes recurrentes del mismo usuario?

Para usuarios que reportan muchos incidentes:
1. Revisa el historial de incidentes del usuario
2. Verifica si hay un patrón (misma plaza, mismo horario)
3. Investiga si hay un problema sistemático
4. Considera reasignar permanentemente al usuario a otra plaza

### ¿Qué hago si la foto no es clara?

Si la evidencia fotográfica no es suficiente:
1. Contacta al usuario para solicitar más información
2. Revisa si hay cámaras de seguridad en el aparcamiento
3. Si no puedes verificar, desestima el incidente con una nota explicativa
4. Educa al usuario sobre cómo capturar mejores fotos

### ¿Puedo ver estadísticas de incidentes?

Actualmente, las estadísticas no están disponibles en la interfaz, pero puedes:
- Filtrar por estado para ver totales
- Exportar datos manualmente
- Solicitar al equipo técnico un reporte personalizado

**Funcionalidad futura**: Panel de analytics con métricas de incidentes.

### ¿Cómo se notifica al infractor?

Actualmente, las notificaciones automáticas no están implementadas. El infractor:
- Verá su reserva cancelada en su calendario
- Puede ver sus amonestaciones en su perfil (si está habilitado)

**Acción recomendada**: Contacta manualmente a usuarios con amonestaciones para informarles.

---

## Soporte Técnico

Si encuentras problemas técnicos con el sistema de gestión de incidentes:

1. **Errores de carga**: Recarga la página y verifica tu conexión
2. **Fotos que no cargan**: Verifica los permisos de Storage en Supabase
3. **Confirmación fallida**: Revisa los logs de la consola del navegador
4. **Datos inconsistentes**: Contacta al equipo de desarrollo

### Contacto

Para soporte técnico o sugerencias de mejora:
- Email: [tu-email-de-soporte]
- Slack: [canal-de-soporte]
- Documentación técnica: `docs/INCIDENT-REPORTING-IMPLEMENTATION-SUMMARY.md`

---

## Registro de Cambios

### Versión 1.0 (Noviembre 2024)
- ✅ Sistema de reporte de incidentes implementado
- ✅ Reasignación automática de plazas
- ✅ Sistema de amonestaciones
- ✅ Grupos de reserva para incidentes
- ✅ Panel de administración completo

### Próximas Funcionalidades
- 📋 Panel de analytics y estadísticas
- 📧 Notificaciones automáticas por email
- 🔔 Notificaciones push para administradores
- 📊 Reportes exportables
- 🤖 Acciones automáticas basadas en amonestaciones

---

**Última actualización**: Noviembre 2024  
**Versión del documento**: 1.0
