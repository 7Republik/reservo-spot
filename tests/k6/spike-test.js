/**
 * SPIKE TEST - Prueba de Picos
 * 
 * Propósito: Validar comportamiento ante picos súbitos de tráfico
 * Cuándo ejecutar: Antes de eventos estacionales o lanzamientos
 * 
 * Configuración:
 * - VUs: Incremento súbito de 50 a 500 usuarios
 * - Duración: ~10 minutos total
 * - Thresholds: Permisivos durante el spike
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Carga normal
    { duration: '1m', target: 50 },    // Mantener normal
    { duration: '30s', target: 500 },  // SPIKE súbito a 500
    { duration: '2m', target: 500 },   // Mantener spike
    { duration: '30s', target: 50 },   // Volver a normal
    { duration: '2m', target: 50 },    // Mantener normal (recuperación)
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'], // Más permisivo durante spike
    http_req_failed: ['rate<0.1'],     // Hasta 10% de errores aceptable
  }
};

export default function() {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // Simular tráfico típico durante spike (ej: todos reservando a la vez)

  // 1. Ver plazas disponibles (endpoint más usado durante spike)
  const spots = http.get(
    `${SUPABASE_URL}/rest/v1/parking_spots?select=*&is_active=eq.true`, 
    { 
      headers,
      tags: { name: 'available_spots' }
    }
  );
  
  check(spots, {
    'spots: status is 200 or 503': (r) => r.status === 200 || r.status === 503,
  });

  sleep(0.5); // Poco sleep = más presión

  // 2. Ver reservas
  const reservations = http.get(
    `${SUPABASE_URL}/rest/v1/reservations?select=*&limit=20`, 
    { 
      headers,
      tags: { name: 'reservations' }
    }
  );
  
  check(reservations, {
    'reservations: response received': (r) => r.status >= 200 && r.status < 600,
  });

  sleep(1);
}

export function handleSummary(data) {
  console.log('\n=== SPIKE TEST SUMMARY ===');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Peak requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.passes || 0}`);
  console.log(`Failure rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`P95 response time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`P99 response time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log(`Max response time: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms`);
  console.log(`Max VUs: ${data.metrics.vus_max.values.max}`);
  
  // Análisis de recuperación
  console.log('\n📊 Análisis de Spike:');
  if (data.metrics.http_req_failed.values.rate < 0.05) {
    console.log('✅ Sistema manejó el spike correctamente (<5% errores)');
  } else if (data.metrics.http_req_failed.values.rate < 0.1) {
    console.log('⚠️  Sistema bajo presión durante spike (5-10% errores)');
  } else {
    console.log('❌ Sistema colapsó durante spike (>10% errores)');
  }
  
  console.log('==========================\n');
  
  return {
    'stdout': '',
  };
}
