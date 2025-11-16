/**
 * STRESS TEST - Prueba de Estrés
 * 
 * Propósito: Encontrar los límites del sistema bajo carga extrema
 * Cuándo ejecutar: Antes de eventos importantes o cambios de infraestructura
 * 
 * Configuración:
 * - VUs: Incremento progresivo hasta 300 usuarios
 * - Duración: ~25 minutos total
 * - Thresholds: Más permisivos (99% < 1s)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp-up a 100
    { duration: '3m', target: 100 },   // Mantener 100
    { duration: '2m', target: 200 },   // Incrementar a 200
    { duration: '3m', target: 200 },   // Mantener 200
    { duration: '2m', target: 300 },   // Incrementar a 300
    { duration: '3m', target: 300 },   // Mantener 300
    { duration: '2m', target: 400 },   // Incrementar a 400 (punto de ruptura)
    { duration: '3m', target: 400 },   // Mantener 400
    { duration: '5m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% de requests < 1s
    http_req_failed: ['rate<0.05'],    // Menos de 5% de errores (más permisivo)
  }
};

export default function() {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // Simular carga intensa en endpoints principales

  // 1. Consulta pesada - Listar todas las plazas con joins
  const spotsWithReservations = http.get(
    `${SUPABASE_URL}/rest/v1/parking_spots?select=*,parking_groups(*),reservations(*)`, 
    { 
      headers,
      tags: { name: 'heavy_query_spots' }
    }
  );
  
  check(spotsWithReservations, {
    'heavy query: status is 200': (r) => r.status === 200,
  });

  sleep(0.5); // Menos sleep = más presión

  // 2. Listar reservas con joins
  const reservationsWithDetails = http.get(
    `${SUPABASE_URL}/rest/v1/reservations?select=*,profiles(*),parking_spots(*)&limit=50`, 
    { 
      headers,
      tags: { name: 'reservations_with_joins' }
    }
  );
  
  check(reservationsWithDetails, {
    'reservations: status is 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // 3. Consulta de incidentes
  const incidents = http.get(
    `${SUPABASE_URL}/rest/v1/incident_reports?select=*,profiles(*),parking_spots(*)`, 
    { 
      headers,
      tags: { name: 'incidents' }
    }
  );
  
  check(incidents, {
    'incidents: status is 200': (r) => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  console.log('\n=== STRESS TEST SUMMARY ===');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.passes || 0}`);
  console.log(`Failure rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`P95 response time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`P99 response time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log(`Max response time: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms`);
  console.log(`Checks passed: ${(data.metrics.checks.values.rate * 100).toFixed(2)}%`);
  console.log(`Max VUs: ${data.metrics.vus_max.values.max}`);
  
  // Análisis de punto de ruptura
  if (data.metrics.http_req_failed.values.rate > 0.05) {
    console.log('\n⚠️  WARNING: Sistema bajo estrés extremo (>5% errores)');
  }
  if (data.metrics.http_req_duration.values['p(99)'] > 2000) {
    console.log('⚠️  WARNING: Tiempos de respuesta degradados (P99 > 2s)');
  }
  
  console.log('============================\n');
  
  return {
    'stdout': '',
  };
}
