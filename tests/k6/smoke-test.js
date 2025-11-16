/**
 * SMOKE TEST - Prueba de Humo
 * 
 * Propósito: Verificar que el script funciona y el sistema responde con carga mínima
 * Cuándo ejecutar: Después de cada cambio de código, antes de tests más grandes
 * 
 * Configuración:
 * - VUs: 2 usuarios virtuales
 * - Duración: 1 minuto
 * - Thresholds: 99% de requests < 1s, < 1% de errores
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export const options = {
  vus: 2,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% de requests < 1s
    http_req_failed: ['rate<0.01'],    // Menos de 1% de errores
    checks: ['rate>0.95'],             // 95% de checks exitosos
  }
};

export default function() {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // Test 1: Health check - Listar perfiles
  const profiles = http.get(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=10`, { 
    headers,
    tags: { name: 'profiles' }
  });
  
  check(profiles, {
    'profiles: status is 200': (r) => r.status === 200,
    'profiles: response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test 2: Listar plazas de parking
  const spots = http.get(`${SUPABASE_URL}/rest/v1/parking_spots?select=id,spot_number&limit=10`, { 
    headers,
    tags: { name: 'parking_spots' }
  });
  
  check(spots, {
    'spots: status is 200': (r) => r.status === 200,
    'spots: response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test 3: Listar reservas
  const reservations = http.get(`${SUPABASE_URL}/rest/v1/reservations?select=id,reservation_date&limit=10`, { 
    headers,
    tags: { name: 'reservations' }
  });
  
  check(reservations, {
    'reservations: status is 200': (r) => r.status === 200,
    'reservations: response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test 4: Consultar check-ins (nuevo)
  const checkins = http.get(`${SUPABASE_URL}/rest/v1/reservation_checkins?select=*&limit=10`, { 
    headers,
    tags: { name: 'checkins' }
  });
  
  check(checkins, {
    'checkins: status is 200': (r) => r.status === 200,
    'checkins: response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test 5: Consultar lista de espera (nuevo)
  const waitlist = http.get(`${SUPABASE_URL}/rest/v1/waitlist_entries?select=id,status&limit=10`, { 
    headers,
    tags: { name: 'waitlist' }
  });
  
  check(waitlist, {
    'waitlist: status is 200': (r) => r.status === 200,
    'waitlist: response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test 6: Consultar amonestaciones (nuevo)
  const warnings = http.get(`${SUPABASE_URL}/rest/v1/user_warnings?select=id,reason&limit=10`, { 
    headers,
    tags: { name: 'warnings' }
  });
  
  check(warnings, {
    'warnings: status is 200': (r) => r.status === 200,
    'warnings: response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}

export function handleSummary(data) {
  console.log('\n=== SMOKE TEST SUMMARY ===');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.passes || 0}`);
  console.log(`Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`P95 response time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`Checks passed: ${(data.metrics.checks.values.rate * 100).toFixed(2)}%`);
  console.log('========================\n');
  
  return {
    'stdout': '', // No output adicional
  };
}
