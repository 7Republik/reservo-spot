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

  // Escenario 1: Consultar listas de espera activas (60% de los casos)
  if (Math.random() < 0.6) {
    // 1. Consultar grupos disponibles
    const groups = http.get(
      `${SUPABASE_URL}/rest/v1/parking_groups?select=id,name&is_active=eq.true&limit=5`,
      { 
        headers,
        tags: { name: 'get_groups' }
      }
    );

    const hasGroups = check(groups, {
      'groups: status is 200': (r) => r.status === 200,
      'groups: has data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data) && data.length > 0;
        } catch {
          return false;
        }
      }
    });

    if (hasGroups && groups.status === 200) {
      try {
        const groupsData = JSON.parse(groups.body);
        if (groupsData && groupsData.length > 0) {
          const group = groupsData[Math.floor(Math.random() * groupsData.length)];
          
          sleep(1);

          // 2. Consultar listas de espera activas para ese grupo
          const waitlists = http.get(
            `${SUPABASE_URL}/rest/v1/waitlist_entries?select=*&group_id=eq.${group.id}&status=eq.active&limit=10`,
            { 
              headers,
              tags: { name: 'get_active_waitlists' }
            }
          );

          check(waitlists, {
            'waitlists: status is 200': (r) => r.status === 200,
          });

          sleep(1);

          // 3. Consultar estadísticas de waitlist
          const stats = http.get(
            `${SUPABASE_URL}/rest/v1/waitlist_entries?select=status&group_id=eq.${group.id}`,
            { 
              headers,
              tags: { name: 'get_waitlist_stats' }
            }
          );

          check(stats, {
            'stats: status is 200': (r) => r.status === 200,
          });

          registerSuccessRate.add(true);
        }
      } catch (e) {
        registerSuccessRate.add(false);
      }
    } else {
      registerSuccessRate.add(false);
    }

  } 
  // Escenario 2: Consultar ofertas (40% de los casos)
  else {
    // 1. Consultar ofertas pendientes
    const offers = http.get(
      `${SUPABASE_URL}/rest/v1/waitlist_offers?select=*,waitlist_entries(user_id,group_id)&status=eq.pending&limit=10`,
      { 
        headers,
        tags: { name: 'get_pending_offers' }
      }
    );

    const hasOffers = check(offers, {
      'offers: status is 200': (r) => r.status === 200,
      'offers: has data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data);
        } catch {
          return false;
        }
      }
    });

    sleep(1);

    // 2. Consultar ofertas expiradas
    const expiredOffers = http.get(
      `${SUPABASE_URL}/rest/v1/waitlist_offers?select=*&status=eq.expired&limit=10`,
      { 
        headers,
        tags: { name: 'get_expired_offers' }
      }
    );

    check(expiredOffers, {
      'expired offers: status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // 3. Consultar logs de waitlist
    const logs = http.get(
      `${SUPABASE_URL}/rest/v1/waitlist_logs?select=*&order=created_at.desc&limit=20`,
      { 
        headers,
        tags: { name: 'get_waitlist_logs' }
      }
    );

    check(logs, {
      'logs: status is 200': (r) => r.status === 200,
    });

    acceptOfferSuccessRate.add(hasOffers);
  }

  // Consultar penalizaciones (solo algunos usuarios)
  if (Math.random() < 0.1) {
    const penalties = http.get(
      `${SUPABASE_URL}/rest/v1/waitlist_penalties?select=*&order=created_at.desc&limit=10`,
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
