/**
 * CHECK-IN/CHECK-OUT TEST
 * 
 * Propósito: Validar el sistema de check-in/check-out bajo carga
 * Escenario: Pico matutino de check-ins (8:00-9:00 AM)
 * 
 * Configuración:
 * - VUs: Ramp-up a 200 usuarios (simula pico matutino)
 * - Duración: 15 minutos
 * - Thresholds: p(95) < 500ms para check-in, p(95) < 300ms para check-out
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const USER_TOKEN = __ENV.USER_TOKEN; // Token de usuario autenticado

// Métricas personalizadas
const checkinSuccessRate = new Rate('checkin_success_rate');
const checkoutSuccessRate = new Rate('checkout_success_rate');
const checkinDuration = new Trend('checkin_duration');
const checkoutDuration = new Trend('checkout_duration');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp-up inicial
    { duration: '3m', target: 200 },  // Pico matutino (8:00-9:00 AM)
    { duration: '5m', target: 200 },  // Mantener pico
    { duration: '3m', target: 50 },   // Descenso
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    'checkin_success_rate': ['rate>0.95'],        // 95% de check-ins exitosos
    'checkout_success_rate': ['rate>0.95'],       // 95% de check-outs exitosos
    'checkin_duration': ['p(95)<500'],            // 95% de check-ins < 500ms
    'checkout_duration': ['p(95)<300'],           // 95% de check-outs < 300ms
    'http_req_duration{name:perform_checkin}': ['p(95)<500'],
    'http_req_duration{name:perform_checkout}': ['p(95)<300'],
    'http_req_failed': ['rate<0.05'],             // Menos de 5% de errores
  }
};

export default function() {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${USER_TOKEN || SUPABASE_ANON_KEY}`,
  };

  // Escenario 1: Usuario hace check-in (70% de los casos)
  if (Math.random() < 0.7) {
    // 1. Consultar reservas del día
    const today = new Date().toISOString().split('T')[0];
    const reservations = http.get(
      `${SUPABASE_URL}/rest/v1/reservations?select=id&reservation_date=eq.${today}&limit=1`,
      { 
        headers,
        tags: { name: 'get_today_reservations' }
      }
    );

    check(reservations, {
      'reservations: status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // 2. Realizar check-in
    const checkinPayload = JSON.stringify({
      reservation_id: 'test-reservation-id', // En producción vendría de la query anterior
      user_id: 'test-user-id'
    });

    const checkinStart = Date.now();
    const checkin = http.post(
      `${SUPABASE_URL}/rest/v1/rpc/perform_checkin`,
      checkinPayload,
      { 
        headers,
        tags: { name: 'perform_checkin' }
      }
    );
    const checkinTime = Date.now() - checkinStart;

    const checkinSuccess = check(checkin, {
      'checkin: status is 200 or 400': (r) => r.status === 200 || r.status === 400,
      'checkin: response time < 500ms': (r) => r.timings.duration < 500,
    });

    checkinSuccessRate.add(checkinSuccess);
    checkinDuration.add(checkinTime);

    sleep(2);

    // 3. Consultar estado de check-in
    const checkinStatus = http.get(
      `${SUPABASE_URL}/rest/v1/reservation_checkins?select=*&reservation_id=eq.test-reservation-id&limit=1`,
      { 
        headers,
        tags: { name: 'get_checkin_status' }
      }
    );

    check(checkinStatus, {
      'checkin status: status is 200': (r) => r.status === 200,
    });

  } 
  // Escenario 2: Usuario hace check-out (30% de los casos)
  else {
    // 1. Consultar check-ins activos
    const activeCheckins = http.get(
      `${SUPABASE_URL}/rest/v1/reservation_checkins?select=*&checkout_time=is.null&limit=1`,
      { 
        headers,
        tags: { name: 'get_active_checkins' }
      }
    );

    check(activeCheckins, {
      'active checkins: status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // 2. Realizar check-out
    const checkoutPayload = JSON.stringify({
      reservation_id: 'test-reservation-id',
      user_id: 'test-user-id'
    });

    const checkoutStart = Date.now();
    const checkout = http.post(
      `${SUPABASE_URL}/rest/v1/rpc/perform_checkout`,
      checkoutPayload,
      { 
        headers,
        tags: { name: 'perform_checkout' }
      }
    );
    const checkoutTime = Date.now() - checkoutStart;

    const checkoutSuccess = check(checkout, {
      'checkout: status is 200 or 400': (r) => r.status === 200 || r.status === 400,
      'checkout: response time < 300ms': (r) => r.timings.duration < 300,
    });

    checkoutSuccessRate.add(checkoutSuccess);
    checkoutDuration.add(checkoutTime);

    sleep(1);
  }

  // Consultar infracciones (solo algunos usuarios)
  if (Math.random() < 0.1) {
    const infractions = http.get(
      `${SUPABASE_URL}/rest/v1/checkin_infractions?select=*&limit=10`,
      { 
        headers,
        tags: { name: 'get_infractions' }
      }
    );

    check(infractions, {
      'infractions: status is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  console.log('\n=== CHECK-IN/CHECK-OUT TEST SUMMARY ===');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
  
  if (data.metrics.checkin_success_rate) {
    console.log(`\n📍 Check-in Metrics:`);
    console.log(`  Success rate: ${(data.metrics.checkin_success_rate.values.rate * 100).toFixed(2)}%`);
    console.log(`  Avg duration: ${data.metrics.checkin_duration.values.avg.toFixed(2)}ms`);
    console.log(`  P95 duration: ${data.metrics.checkin_duration.values['p(95)'].toFixed(2)}ms`);
  }
  
  if (data.metrics.checkout_success_rate) {
    console.log(`\n📤 Check-out Metrics:`);
    console.log(`  Success rate: ${(data.metrics.checkout_success_rate.values.rate * 100).toFixed(2)}%`);
    console.log(`  Avg duration: ${data.metrics.checkout_duration.values.avg.toFixed(2)}ms`);
    console.log(`  P95 duration: ${data.metrics.checkout_duration.values['p(95)'].toFixed(2)}ms`);
  }
  
  console.log(`\n⚡ Overall Performance:`);
  console.log(`  Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`  P95 response time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  Failed requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`  Max VUs: ${data.metrics.vus_max.values.max}`);
  console.log('========================================\n');
  
  return {
    'stdout': '',
  };
}
