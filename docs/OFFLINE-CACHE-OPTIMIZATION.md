# Optimizaciones del Cache Offline

## Resumen

El sistema de cache offline de RESERVEO ha sido optimizado con las siguientes mejoras:

1. **Compresión automática de datos** usando LZ-string
2. **Estrategia LRU** (Least Recently Used) para limpieza inteligente
3. **Monitoreo de uso de almacenamiento** con estadísticas detalladas

## 1. Compresión Automática

### ¿Cómo funciona?

- Los datos **mayores a 1KB** se comprimen automáticamente usando LZ-string
- Los datos **menores a 1KB** se guardan sin comprimir (overhead no vale la pena)
- La compresión/descompresión es **transparente** para el usuario

### Beneficios

- **Ahorro de espacio**: Típicamente 50-70% de reducción en datos JSON
- **Más datos en cache**: Puedes almacenar más información en los 10MB disponibles
- **Sin cambios en el código**: La API sigue siendo la misma

### Ejemplo

```typescript
// Datos grandes se comprimen automáticamente
const largeData = {
  reservations: Array.from({ length: 100 }, (_, i) => ({
    id: i,
    date: '2025-11-21',
    spot: `A-${i}`,
    user: 'John Doe'
  }))
};

await offlineCache.set('reservations', largeData);
// ✅ Guardado comprimido (ahorra ~60% de espacio)

const data = await offlineCache.get('reservations');
// ✅ Descomprimido automáticamente
```

## 2. Estrategia LRU (Least Recently Used)

### ¿Qué es LRU?

LRU es una estrategia de limpieza que elimina los datos **menos usados recientemente** cuando el cache está lleno.

### ¿Cómo funciona?

1. Cada vez que accedes a un dato, se actualiza su timestamp de `lastAccessed`
2. Cuando el cache alcanza el límite (10MB), se ejecuta `evictLRU()`
3. Se eliminan el **20% de las entradas menos usadas**
4. Los datos que usas frecuentemente se mantienen en cache

### Beneficios

- **Inteligente**: Mantiene los datos que realmente usas
- **Automático**: No necesitas gestionar manualmente qué eliminar
- **Eficiente**: Solo elimina lo necesario (20% cada vez)

### Ejemplo

```typescript
// Usuario accede frecuentemente a su perfil
await offlineCache.get('profile'); // lastAccessed actualizado

// Usuario accede a reservas del día
await offlineCache.get('today_reservation'); // lastAccessed actualizado

// Cache se llena...
// ❌ Datos antiguos no usados se eliminan primero
// ✅ Perfil y reserva del día se mantienen (usados recientemente)
```

## 3. Monitoreo de Almacenamiento

### Estadísticas Disponibles

```typescript
const stats = await offlineCache.getStats();

console.log(stats);
// {
//   totalSize: 5242880,              // Bytes
//   totalSizeFormatted: "5 MB",      // Legible
//   maxSize: 10485760,               // 10 MB
//   maxSizeFormatted: "10 MB",
//   percentageUsed: 50,              // 50%
//   entryCount: 25,                  // Número de entradas
//   compressedCount: 15,             // Entradas comprimidas
//   oldestEntry: Date,               // Entrada más antigua
//   newestEntry: Date                // Entrada más reciente
// }
```

### Uso en Componentes

```typescript
function CacheMonitor() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const loadStats = async () => {
      const cacheStats = await offlineCache.getStats();
      setStats(cacheStats);
      
      // Advertir si está casi lleno
      if (cacheStats.percentageUsed > 90) {
        toast.warning('Cache casi lleno. Limpiando datos antiguos...');
        await offlineCache.cleanOldData();
      }
    };
    
    loadStats();
    const interval = setInterval(loadStats, 60000); // Cada minuto
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <p>Uso: {stats?.totalSizeFormatted} / {stats?.maxSizeFormatted}</p>
      <p>Porcentaje: {stats?.percentageUsed}%</p>
      <ProgressBar value={stats?.percentageUsed} />
    </div>
  );
}
```

## Comparación: Antes vs Después

### Antes de las Optimizaciones

```
Cache de 10MB:
- 50 reservas sin comprimir: ~8 MB
- 20 mapas de plazas: ~2 MB
- Total: 10 MB (lleno)
- Limpieza: Eliminar datos antiguos (sin considerar uso)
```

### Después de las Optimizaciones

```
Cache de 10MB:
- 50 reservas comprimidas: ~3 MB (62% ahorro)
- 20 mapas comprimidos: ~0.8 MB (60% ahorro)
- 100 perfiles: ~1.2 MB
- Matrículas, grupos, etc: ~1 MB
- Total: 6 MB (40% libre)
- Limpieza: LRU elimina solo lo menos usado
```

**Resultado**: Puedes almacenar **2-3x más datos** en el mismo espacio.

## Mejores Prácticas

### 1. Monitorear Periódicamente

```typescript
// En tu hook principal
useEffect(() => {
  const checkCache = async () => {
    const stats = await offlineCache.getStats();
    
    if (stats.percentageUsed > 80) {
      console.warn('Cache alto:', stats.percentageUsed + '%');
    }
  };
  
  checkCache();
  const interval = setInterval(checkCache, 300000); // Cada 5 min
  
  return () => clearInterval(interval);
}, []);
```

### 2. Limpiar al Cerrar Sesión

```typescript
const handleLogout = async () => {
  await offlineCache.clear(); // Limpia todo
  await supabase.auth.signOut();
};
```

### 3. Priorizar Datos Críticos

```typescript
// Acceder frecuentemente a datos críticos
// para que LRU los mantenga en cache
const loadCriticalData = async () => {
  await offlineCache.get('profile');
  await offlineCache.get('today_reservation');
  await offlineCache.get('license_plates');
};
```

### 4. Evitar Datos Innecesarios

```typescript
// ❌ NO cachear datos que no se usan offline
await offlineCache.set('admin_stats', stats); // No necesario offline

// ✅ Solo cachear datos esenciales
await offlineCache.set('today_reservation', reservation);
```

## Impacto en el Rendimiento

### Compresión

- **Tiempo de compresión**: ~5-10ms para 100KB de datos
- **Tiempo de descompresión**: ~2-5ms
- **Overhead**: Mínimo, solo para datos > 1KB

### LRU

- **Tiempo de ejecución**: ~50-100ms para 100 entradas
- **Frecuencia**: Solo cuando el cache está lleno
- **Impacto**: Imperceptible para el usuario

### Monitoreo

- **Tiempo de cálculo**: ~20-50ms
- **Recomendación**: Ejecutar cada 1-5 minutos, no en cada render

## Troubleshooting

### Cache se llena muy rápido

**Causa**: Datos muy grandes o muchas entradas

**Solución**:
1. Verificar qué datos se están cacheando: `await offlineCache.getStats()`
2. Reducir datos innecesarios
3. Aumentar frecuencia de limpieza: `await offlineCache.cleanOldData()`

### Compresión no funciona

**Causa**: Librería LZ-string no instalada

**Solución**:
```bash
npm install lz-string
```

### LRU elimina datos importantes

**Causa**: Datos no se acceden frecuentemente

**Solución**:
```typescript
// Acceder periódicamente a datos críticos
setInterval(async () => {
  await offlineCache.get('critical_data');
}, 60000); // Cada minuto
```

## Referencias

- **LZ-string**: https://github.com/pieroxy/lz-string
- **LRU Cache**: https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)
- **IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

## Próximos Pasos

Posibles mejoras futuras:

1. **Compresión adaptativa**: Ajustar nivel de compresión según el dispositivo
2. **Prioridades de cache**: Marcar datos como "críticos" para nunca eliminarlos
3. **Sincronización inteligente**: Precargar datos según patrones de uso
4. **Métricas avanzadas**: Tracking de hit/miss ratio, tiempos de acceso, etc.
