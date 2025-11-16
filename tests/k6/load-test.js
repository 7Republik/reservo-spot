/**
 * LOAD TEST - Prueba de Carga
 * 
 * Propósito: Verificar rendimiento bajo carga normal/esperada
 * Cuándo ejecutar: Regularmente, para validar que el sistema mantiene el rendimiento
 * 
 * Configuración:
 * - VUs: Ramp-up a 50 usuarios (carga promedio esperada)
 * - Duración: 10 minutos total
 * - Thresholds: 95% de requests < 500ms, < 1% de errores
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp-up a 50 usuarios en 2 min
    { duration: '5m', target: 50 },   // Mantener 50 usuarios por 5 min
    { duration: '2m', target: 100 },  // Incrementar a 100 usuarios
    { duration: '3m', target: 100 },  // Mantener 100 usuarios por 3 min
    { duration: '2m', target: 0 },    // Ramp-down a 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% de requests < 500ms
    http_req_failed: ['rate<0.01'],    // Menos de 1% de errores
    checks: ['rate>0.95'],             // 95% de checks exitosos
  }
};

export default function() {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // Simular flujo de usuario típico

  // 1. Ver dashboard - Listar perfiles
  const profiles = http.get(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=20`, { 
    headers,
    tags: { name: 'list_profiles' }
  });
  
  check(profiles, {
    'profiles: status is 200': (r) => r.status === 200,
    'profiles: response time OK': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // 2. Ver plazas disponibles
  const spots = http.get(`${SUPABASE_URL}/rest/v1/parking_spots?select=*&is_active=eq.true`, { 
    headers,
    tags: { name: 'list_spots' }
  });
  
  check(spots, {
    'spots: status is 200': (r) => r.status === 200,
    'spots: response time OK': (r) => r.timings.duration < 500,
  });

  sleep(2);

  // 3. Ver reservas del usuario
  const reservations = http.get(`${SUPABASE_URL}/rest/v1/reservations?select=*&order=reservation_date.desc&limit=10`, { 
    headers,
    tags: { name: 'list_reservations' }
  });
  
  check(reservations, {
    'reservations: status is 200': (r) => r.status === 200,
    'reservations: response time OK': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // 4. Ver grupos de parking
  const groups = http.get(`${SUPABASE_URL}/rest/v1/parking_groups?select=*&is_active=eq.true`, { 
    headers,
    tags: { name: 'list_groups' }
  });
  
  check(groups, {
    'groups: status is 200': (r) => r.status === 200,
    'groups: response time OK': (r) => r.timings.duration < 500,
  });

  sleep(2);
}

export function handleSummary(data) {
  console.log('\n=== LOAD TEST SUMMARY ===');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.passes || 0}`);
  console.log(`Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`P95 response time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`P99 response time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log(`Checks passed: ${(data.metrics.checks.values.rate * 100).toFixed(2)}%`);
  console.log(`Max VUs: ${data.metrics.vus_max.values.max}`);
  console.log('=========================\n');
  
  return {
    'stdout': '',
  };
}
