/**
 * WAITLIST TEST
 * 
 * Propósito: Validar el sistema de lista de espera bajo carga
 * Escenario: Múltiples usuarios registrándose y procesando ofertas
 * 
 * Configuración:
 * - VUs: 50 usuarios simultáneos
 * - Duración: 10 minutos
 * - Thresholds: p(95) < 300ms para registro, p(95) < 1s para procesamiento
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const USER_TOKEN = __ENV.USER_TOKEN;

// Métricas personalizadas
const registerSuccessRate = new Rate('waitlist_register_success');
const acceptOfferSuccessRate = new Rate('waitlist_accept_success');
const rejectOfferSuccessRate = new Rate('waitlist_reject_success');
const registerDuration = new Trend('waitlist_register_duration');
const processDuration = new Trend('waitlist_process_duration');
const offersCounter = new Counter('waitlist_offers_created');

export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Ramp-up
    { duration: '5m', target: 50 },   // Carga normal
    { duration: '2m', target: 50 },   // Mantener
    { duration: '1m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    'waitlist_register_success': ['rate>0.90'],   // 90% de registros exitosos
    'waitlist_accept_success': ['rate>0.95'],     // 95% de aceptaciones exitosas
    'waitlist_register_duration': ['p(95)<300'],  // 95% de registros < 300ms
    'waitlist_process_duration': ['p(95)<1000'],  // 95% de procesamientos < 1s
    'http_req_duration{name:register_waitlist}': ['p(95)<300'],
    'http_req_duration{name:process_waitlist}': ['p(95)<1000'],
    'http_req_failed': ['rate<0.10'],             // Menos de 10% de errores
  }
};

export default function() {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${USER_TOKEN || SUPABASE_ANON_KEY}`,
  };

  // Escenario 1: Registrarse en lista de espera (60% de los casos)
  if (Math.random() < 0.6) {
    // 1. Consultar grupos disponibles
    const groups = http.get(
      `${SUPABASE_URL}/rest/v1/parking_groups?select=id&is_active=eq.true&limit=5`,
      { 
        headers,
        tags: { name: 'get_groups' }
      }
    );

    check(groups, {
      'groups: status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // 2. Registrarse en lista de espera
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 7) + 1);
    const dateStr = futureDate.toISOString().split('T')[0];

    const registerPayload = JSON.stringify({
      user_id: `test-user-${__VU}`,
      group_id: 'test-group-id',
      reservation_date: dateStr
    });

    const registerStart = Date.now();
    const register = http.post(
      `${SUPABASE_URL}/rest/v1/rpc/register_in_waitlist`,
      registerPayload,
      { 
        headers,
        tags: { name: 'register_waitlist' }
      }
    );
    const registerTime = Date.now() - registerStart;

    const registerSuccess = check(register, {
      'register: status is 200 or 400': (r) => r.status === 200 || r.status === 400,
      'register: response time < 300ms': (r) => r.timings.duration < 300,
    });

    registerSuccessRate.add(registerSuccess);
    registerDuration.add(registerTime);

    sleep(2);

    // 3. Consultar posición en lista
    const position = http.get(
      `${SUPABASE_URL}/rest/v1/waitlist_entries?select=*&user_id=eq.test-user-${__VU}&limit=5`,
      { 
        headers,
        tags: { name: 'get_waitlist_position' }
      }
    );

    check(position, {
      'position: status is 200': (r) => r.status === 200,
    });

  } 
  // Escenario 2: Procesar lista de espera (20% de los casos)
  else if (Math.random() < 0.75) {
    // Simular liberación de plaza y procesamiento de waitlist
    const processPayload = JSON.stringify({
      spot_id: 'test-spot-id',
      reservation_date: new Date().toISOString().split('T')[0]
    });

    const processStart = Date.now();
    const process = http.post(
      `${SUPABASE_URL}/rest/v1/rpc/process_waitlist_for_spot`,
      processPayload,
      { 
        headers,
        tags: { name: 'process_waitlist' }
      }
    );
    const processTime = Date.now() - processStart;

    check(process, {
      'process: status is 200 or 400': (r) => r.status === 200 || r.status === 400,
      'process: response time < 1s': (r) => r.timings.duration < 1000,
    });

    processDuration.add(processTime);

    sleep(1);

  } 
  // Escenario 3: Aceptar/Rechazar oferta (20% de los casos)
  else {
    // 1. Consultar ofertas pendientes
    const offers = http.get(
      `${SUPABASE_URL}/rest/v1/waitlist_offers?select=*&status=eq.pending&limit=5`,
      { 
        headers,
        tags: { name: 'get_pending_offers' }
      }
    );

    check(offers, {
      'offers: status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // 2. Aceptar o rechazar (50/50)
    if (Math.random() < 0.5) {
      // Aceptar oferta
      const acceptPayload = JSON.stringify({
        offer_id: 'test-offer-id',
        user_id: `test-user-${__VU}`
      });

      const accept = http.post(
        `${SUPABASE_URL}/rest/v1/rpc/accept_waitlist_offer`,
        acceptPayload,
        { 
          headers,
          tags: { name: 'accept_offer' }
        }
      );

      const acceptSuccess = check(accept, {
        'accept: status is 200 or 400': (r) => r.status === 200 || r.status === 400,
        'accept: response time < 500ms': (r) => r.timings.duration < 500,
      });

      acceptOfferSuccessRate.add(acceptSuccess);

    } else {
      // Rechazar oferta
      const rejectPayload = JSON.stringify({
        offer_id: 'test-offer-id',
        user_id: `test-user-${__VU}`
      });

      const reject = http.post(
        `${SUPABASE_URL}/rest/v1/rpc/reject_waitlist_offer`,
        rejectPayload,
        { 
          headers,
          tags: { name: 'reject_offer' }
        }
      );

      const rejectSuccess = check(reject, {
        'reject: status is 200 or 400': (r) => r.status === 200 || r.status === 400,
        'reject: response time < 500ms': (r) => r.timings.duration < 500,
      });

      rejectOfferSuccessRate.add(rejectSuccess);
    }

    sleep(1);
  }

  // Consultar penalizaciones (solo algunos usuarios)
  if (Math.random() < 0.05) {
    const penalties = http.get(
      `${SUPABASE_URL}/rest/v1/waitlist_penalties?select=*&user_id=eq.test-user-${__VU}`,
      { 
        headers,
        tags: { name: 'get_penalties' }
      }
    );

    check(penalties, {
      'penalties: status is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  console.log('\n=== WAITLIST TEST SUMMARY ===');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
  
  if (data.metrics.waitlist_register_success) {
    console.log(`\n📝 Registration Metrics:`);
    console.log(`  Success rate: ${(data.metrics.waitlist_register_success.values.rate * 100).toFixed(2)}%`);
    console.log(`  Avg duration: ${data.metrics.waitlist_register_duration.values.avg.toFixed(2)}ms`);
    console.log(`  P95 duration: ${data.metrics.waitlist_register_duration.values['p(95)'].toFixed(2)}ms`);
  }
  
  if (data.metrics.waitlist_process_duration) {
    console.log(`\n⚙️  Processing Metrics:`);
    console.log(`  Avg duration: ${data.metrics.waitlist_process_duration.values.avg.toFixed(2)}ms`);
    console.log(`  P95 duration: ${data.metrics.waitlist_process_duration.values['p(95)'].toFixed(2)}ms`);
  }
  
  if (data.metrics.waitlist_accept_success) {
    console.log(`\n✅ Accept/Reject Metrics:`);
    console.log(`  Accept success rate: ${(data.metrics.waitlist_accept_success.values.rate * 100).toFixed(2)}%`);
    if (data.metrics.waitlist_reject_success) {
      console.log(`  Reject success rate: ${(data.metrics.waitlist_reject_success.values.rate * 100).toFixed(2)}%`);
    }
  }
  
  console.log(`\n⚡ Overall Performance:`);
  console.log(`  Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`  P95 response time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  Failed requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`  Max VUs: ${data.metrics.vus_max.values.max}`);
  console.log('=============================\n');
  
  return {
    'stdout': '',
  };
}
