/**
 * Ejemplo de uso de las optimizaciones del OfflineCache
 * 
 * Demuestra:
 * - Compresión automática de datos grandes
 * - Estrategia LRU para limpieza
 * - Monitoreo de uso de almacenamiento
 */

import { offlineCache } from '../offlineCache';

// Ejemplo 1: Compresión automática
async function exampleCompression() {
  console.log('=== Ejemplo 1: Compresión Automática ===');
  
  // Datos pequeños (< 1KB) - No se comprimen
  const smallData = { id: 1, name: 'John' };
  await offlineCache.set('small', smallData);
  
  // Datos grandes (> 1KB) - Se comprimen automáticamente
  const largeData = {
    id: 1,
    name: 'John Doe',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50),
    items: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: 'Some description here'
    }))
  };
  await offlineCache.set('large', largeData);
  
  // Obtener estadísticas
  const stats = await offlineCache.getStats();
  console.log('Estadísticas del cache:');
  console.log(`- Total: ${stats.totalSizeFormatted} / ${stats.maxSizeFormatted}`);
  console.log(`- Uso: ${stats.percentageUsed}%`);
  console.log(`- Entradas: ${stats.entryCount}`);
  console.log(`- Comprimidas: ${stats.compressedCount}`);
}

// Ejemplo 2: Estrategia LRU
async function exampleLRU() {
  console.log('\n=== Ejemplo 2: Estrategia LRU ===');
  
  // Llenar el cache con muchos datos
  for (let i = 0; i < 50; i++) {
    await offlineCache.set(`item_${i}`, {
      id: i,
      data: 'Some data here '.repeat(100)
    });
  }
  
  console.log('Cache lleno con 50 entradas');
  
  // Acceder a algunas entradas (las marca como usadas recientemente)
  await offlineCache.get('item_0');
  await offlineCache.get('item_1');
  await offlineCache.get('item_2');
  console.log('Accedidas entradas 0, 1, 2 (marcadas como usadas recientemente)');
  
  // Forzar limpieza LRU
  const stats = await offlineCache.getStats();
  console.log(`Tamaño antes de LRU: ${stats.totalSizeFormatted}`);
  
  // La limpieza LRU se ejecuta automáticamente cuando el cache está lleno
  // Pero podemos simularla añadiendo más datos
  await offlineCache.set('trigger_lru', {
    data: 'Large data '.repeat(10000)
  });
  
  const statsAfter = await offlineCache.getStats();
  console.log(`Tamaño después de LRU: ${statsAfter.totalSizeFormatted}`);
  console.log(`Entradas eliminadas: ${stats.entryCount - statsAfter.entryCount}`);
  
  // Las entradas 0, 1, 2 deberían seguir existiendo (usadas recientemente)
  const item0 = await offlineCache.get('item_0');
  const item49 = await offlineCache.get('item_49');
  console.log(`Item 0 existe: ${item0 !== null}`);
  console.log(`Item 49 existe: ${item49 !== null} (probablemente eliminado por LRU)`);
}

// Ejemplo 3: Monitoreo de almacenamiento
async function exampleMonitoring() {
  console.log('\n=== Ejemplo 3: Monitoreo de Almacenamiento ===');
  
  // Obtener estadísticas detalladas
  const stats = await offlineCache.getStats();
  
  console.log('Estadísticas completas:');
  console.log(`- Tamaño total: ${stats.totalSizeFormatted}`);
  console.log(`- Tamaño máximo: ${stats.maxSizeFormatted}`);
  console.log(`- Porcentaje usado: ${stats.percentageUsed}%`);
  console.log(`- Número de entradas: ${stats.entryCount}`);
  console.log(`- Entradas comprimidas: ${stats.compressedCount}`);
  console.log(`- Entrada más antigua: ${stats.oldestEntry?.toLocaleString() || 'N/A'}`);
  console.log(`- Entrada más reciente: ${stats.newestEntry?.toLocaleString() || 'N/A'}`);
  
  // Advertir si el cache está casi lleno
  if (stats.percentageUsed > 80) {
    console.warn('⚠️ Cache casi lleno! Considera limpiar datos antiguos.');
  }
  
  // Mostrar ratio de compresión
  if (stats.compressedCount > 0) {
    const compressionRatio = (stats.compressedCount / stats.entryCount) * 100;
    console.log(`- Ratio de compresión: ${compressionRatio.toFixed(1)}%`);
  }
}

// Ejemplo 4: Uso en componente React
export function ExampleComponent() {
  const [stats, setStats] = React.useState<any>(null);
  
  React.useEffect(() => {
    // Monitorear el cache periódicamente
    const interval = setInterval(async () => {
      const cacheStats = await offlineCache.getStats();
      setStats(cacheStats);
      
      // Advertir si está casi lleno
      if (cacheStats.percentageUsed > 90) {
        console.warn('Cache crítico! Limpiando datos antiguos...');
        await offlineCache.cleanOldData();
      }
    }, 60000); // Cada minuto
    
    return () => clearInterval(interval);
  }, []);
  
  if (!stats) return <div>Cargando estadísticas...</div>;
  
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Estado del Cache Offline</h3>
      <div className="space-y-1 text-sm">
        <div>Uso: {stats.totalSizeFormatted} / {stats.maxSizeFormatted}</div>
        <div>Porcentaje: {stats.percentageUsed}%</div>
        <div>Entradas: {stats.entryCount}</div>
        <div>Comprimidas: {stats.compressedCount}</div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full ${
              stats.percentageUsed > 80 ? 'bg-red-500' : 
              stats.percentageUsed > 50 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${stats.percentageUsed}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Ejecutar ejemplos
export async function runExamples() {
  await exampleCompression();
  await exampleLRU();
  await exampleMonitoring();
}
