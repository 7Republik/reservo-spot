# 📖 Ejemplos de Uso - Supabase MCP Server

Colección de comandos útiles para usar con el servidor MCP de Supabase.

---

## 🔍 Exploración de Base de Datos

### Listar todas las tablas
```
Lista todas las tablas de la base de datos
```

### Ver estructura de una tabla
```
Describe la tabla reservations
```

### Contar registros en una tabla
```
¿Cuántos registros hay en la tabla profiles?
```

### Ver las últimas filas de una tabla
```
Muestra las últimas 10 reservas ordenadas por fecha
```

---

## 👥 Consultas de Usuarios

### Listar usuarios
```
Muestra todos los usuarios con su email y fecha de creación
```

### Contar usuarios por rol
```
¿Cuántos usuarios tienen rol de admin?
```

### Ver usuarios bloqueados
```
Muestra los usuarios que están bloqueados
```

### Buscar usuario por email
```
Busca el usuario con email "ejemplo@empresa.com"
```

---

## 🅿️ Consultas de Parking

### Listar grupos de parking
```
Muestra todos los grupos de parking activos
```

### Contar plazas por grupo
```
¿Cuántas plazas hay en cada grupo de parking?
```

### Ver plazas disponibles
```
Muestra las plazas de parking que no tienen reservas para hoy
```

### Plazas accesibles
```
Lista todas las plazas accesibles para personas con discapacidad
```

---

## 📅 Consultas de Reservas

### Reservas de hoy
```
Muestra todas las reservas para hoy
```

### Reservas por usuario
```
Muestra las reservas del usuario con ID "xxx-xxx-xxx"
```

### Reservas futuras
```
¿Cuántas reservas hay programadas para los próximos 7 días?
```

### Historial de reservas
```
Muestra las últimas 20 reservas con usuario, plaza y fecha
```

---

## 🚗 Consultas de Matrículas

### Matrículas pendientes
```
¿Cuántas matrículas están pendientes de aprobación?
```

### Listar matrículas aprobadas
```
Muestra todas las matrículas aprobadas
```

### Matrículas por usuario
```
Lista las matrículas del usuario "xxx-xxx-xxx"
```

### Matrículas rechazadas
```
Muestra las matrículas rechazadas con su motivo
```

---

## 🔐 Seguridad y RLS

### Ver políticas RLS de una tabla
```
Muestra las políticas RLS de la tabla profiles
```

### Verificar políticas de reservations
```
¿Qué políticas RLS tiene la tabla reservations?
```

### Listar todas las políticas
```
Lista todas las políticas RLS del esquema public
```

---

## 📊 Análisis y Estadísticas

### Usuarios más activos
```
Muestra los 10 usuarios con más reservas
```

### Plazas más reservadas
```
¿Cuáles son las 5 plazas más reservadas?
```

### Ocupación por día
```
Muestra la ocupación de plazas para cada día de esta semana
```

### Estadísticas generales
```
Dame un resumen con:
- Total de usuarios
- Total de plazas
- Total de reservas
- Matrículas pendientes
```

---

## 🔧 Gestión de Migraciones

### Listar migraciones
```
Lista todas las migraciones aplicadas
```

### Leer una migración específica
```
Muestra el contenido de la migración "20251105193026_be0a24e9-3082-4ede-b748-a27c45d89117.sql"
```

### Ver diferencias con remoto
```
Ejecuta el comando: db diff
```

### Listar migraciones remotas
```
Ejecuta: migration list --linked
```

---

## 🛠️ Comandos CLI Útiles

### Estado de servicios locales
```
Verifica el estado de Supabase local
```

### Generar tipos TypeScript
```
Ejecuta: gen types typescript --linked
```

### Ver logs de funciones
```
Ejecuta: functions logs mi-funcion --limit 20
```

### Backup de base de datos
```
Ejecuta: db dump --data-only
```

---

## 🔍 Consultas Avanzadas

### Reservas con información completa
```sql
SELECT 
  r.id,
  r.reservation_date,
  p.full_name as usuario,
  ps.spot_number as plaza,
  pg.name as grupo,
  r.license_plate
FROM reservations r
JOIN profiles p ON r.user_id = p.id
JOIN parking_spots ps ON r.spot_id = ps.id
JOIN parking_groups pg ON ps.group_id = pg.id
WHERE r.reservation_date >= CURRENT_DATE
ORDER BY r.reservation_date
LIMIT 20;
```

### Usuarios con sus roles y grupos
```sql
SELECT 
  p.email,
  p.full_name,
  ur.role,
  array_agg(pg.name) as grupos_acceso
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN user_group_assignments uga ON p.id = uga.user_id
LEFT JOIN parking_groups pg ON uga.group_id = pg.id
GROUP BY p.id, p.email, p.full_name, ur.role
ORDER BY p.created_at DESC;
```

### Ocupación por grupo
```sql
SELECT 
  pg.name as grupo,
  COUNT(DISTINCT ps.id) as total_plazas,
  COUNT(r.id) as reservas_hoy,
  ROUND(COUNT(r.id)::numeric / COUNT(DISTINCT ps.id) * 100, 2) as ocupacion_porcentaje
FROM parking_groups pg
LEFT JOIN parking_spots ps ON pg.id = ps.group_id
LEFT JOIN reservations r ON ps.id = r.spot_id AND r.reservation_date = CURRENT_DATE
GROUP BY pg.id, pg.name
ORDER BY ocupacion_porcentaje DESC;
```

---

## 📈 Monitoreo y Mantenimiento

### Tamaño de tablas
```
Ejecuta: SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Índices no utilizados
```
Muestra los índices que no se están usando
```

### Conexiones activas
```
¿Cuántas conexiones activas hay a la base de datos?
```

---

## 🎯 Casos de Uso Específicos

### Preparar demo
```
1. Cuenta cuántos usuarios hay
2. Cuenta cuántas reservas hay para hoy
3. Muestra los grupos de parking activos
4. Lista las últimas 5 reservas
```

### Debugging de problema
```
1. Describe la tabla con el problema
2. Muestra las políticas RLS
3. Cuenta registros con filtros específicos
4. Verifica la última migración aplicada
```

### Análisis de uso
```
1. ¿Cuántas reservas se hicieron esta semana?
2. ¿Qué usuarios no han hecho reservas nunca?
3. ¿Qué plazas nunca se han reservado?
4. ¿Cuál es el promedio de reservas por usuario?
```

---

## 💡 Tips y Trucos

### Combinar herramientas
```
1. Lista las tablas
2. Describe la tabla más interesante
3. Cuenta sus registros
4. Muestra ejemplos de datos
```

### Usar filtros
```
Cuenta las reservas donde reservation_date = '2025-01-15'
```

### Ordenar resultados
```
Muestra los usuarios ordenados por fecha de creación descendente
```

### Limitar resultados
```
Muestra solo los primeros 5 grupos de parking
```

---

## 🚀 Automatización

### Script de verificación diaria
```
1. Cuenta reservas para hoy
2. Cuenta matrículas pendientes
3. Verifica usuarios bloqueados
4. Lista fechas bloqueadas próximas
```

### Health check
```
1. Verifica estado de servicios locales
2. Lista todas las tablas
3. Cuenta registros en tablas principales
4. Verifica última migración
```

---

## 📝 Notas Importantes

### Limitaciones de SELECT
- Solo se permiten queries SELECT por seguridad
- Para INSERT/UPDATE/DELETE usa `supabase_cli_command` con psql

### Respeto a RLS
- Todas las queries respetan Row Level Security
- Los resultados dependen del usuario autenticado
- Para bypass RLS, usa Service Role (no disponible en MCP por seguridad)

### Performance
- Limita resultados con LIMIT para queries grandes
- Usa índices apropiados para queries complejas
- Considera usar vistas materializadas para análisis pesados

---

**¿Necesitas más ejemplos?** Consulta el README.md o pregunta a Kiro directamente.

---

**Versión:** 1.0.0  
**Proyecto:** Reserveo  
**Última actualización:** 2025-11-11
