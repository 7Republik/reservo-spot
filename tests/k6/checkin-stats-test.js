/**
 * CHECK-IN STATISTICS TEST
 * 
 * Propósito: Validar el dashboard de estadísticas de check-in bajo carga
 * Escenario: 20 admins consultando estadísticas simultáneamente
 * 
 * Configuración:
 * - VUs: 20 admins
 * - Duración: 5 minutos
 * - Thresholds: p(95) < 1s para stats, p(95) < 2s para heatmap
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || __ENV.USER_TOKEN;

// Métricas personalizadas
const statsQueryDuration = new Trend('stats_query_duration');
const heatmapQueryDuration = new Trend('heatmap_query_duration');
const activityQueryDuration = new Trend('activity_query_duration');
const statsSuccessRate = new Rate('stats_success_rate');

export const options = {
  vus: 20,
  duration: '5m',
  thresholds: {
    'stats_query_duration': ['p(95)<1000'],      // 95% de stats < 1s
    'heatmap_query_duration': ['p(95)<2000'],    // 95% de heatmap < 2s
    'activity_query_duration': ['p(95)<1000'],   // 95% de activity < 1s
    'stats_success_rate': ['rate>0.95'],         // 95% de queries exitosas
    'http_req_duration{name:get_checkin_stats}': ['p(95)<1000'],
    'http_req_duration{name:get_checkin_heatmap}': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
  }
};

export default function() {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${ADMIN_TOKEN || SUPABASE_ANON_KEY}`,
  };

  // Calcular rango de fechas (últimos 30 días)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const dateRange = {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0]
  };

  // 1. Consultar estadísticas generales
  const statsPayload = JSON.stringify({
    group_id: null, // Todas las plazas
    ...dateRange
  });

  const statsStart = Date.now();
  const stats = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_checkin_stats`,
    statsPayload,
    { 
      headers,
      tags: { name: 'get_checkin_stats' }
    }
  );
  const statsTime = Date.now() - statsStart;

  const statsSuccess = check(stats, {
    'stats: status is 200': (r) => r.status === 200,
    'stats: response time < 1s': (r) => r.timings.duration < 1000,
    'stats: has data': (r) => r.body && r.body.length > 0,
  });

  statsSuccessRate.add(statsSuccess);
  statsQueryDuration.add(statsTime);

  sleep(2);

  // 2. Consultar actividad por hora
  const activityPayload = JSON.stringify({
    group_id: null,
    ...dateRange
  });

  const activityStart = Date.now();
  const activity = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_checkin_activity_by_hour`,
    activityPayload,
    { 
      headers,
      tags: { name: 'get_checkin_activity' }
    }
  );
  const activityTime = Date.now() - activityStart;

  check(activity, {
    'activity: status is 200': (r) => r.status === 200,
    'activity: response time < 1s': (r) => r.timings.duration < 1000,
  });

  activityQueryDuration.add(activityTime);

  sleep(2);

  // 3. Consultar heatmap (query más pesada)
  const heatmapPayload = JSON.stringify({
    group_id: null,
    ...dateRange
  });

  const heatmapStart = Date.now();
  const heatmap = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_checkin_heatmap`,
    heatmapPayload,
    { 
      headers,
      tags: { name: 'get_checkin_heatmap' }
    }
  );
  const heatmapTime = Date.now() - heatmapStart;

  check(heatmap, {
    'heatmap: status is 200': (r) => r.status === 200,
    'heatmap: response time < 2s': (r) => r.timings.duration < 2000,
  });

  heatmapQueryDuration.add(heatmapTime);

  sleep(3);

  // 4. Consultar top usuarios rápidos
  const topUsersPayload = JSON.stringify({
    group_id: null,
    ...dateRange,
    limit_count: 10
  });

  const topUsers = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_top_fast_checkin_users`,
    topUsersPayload,
    { 
      headers,
      tags: { name: 'get_top_users' }
    }
  );

  check(topUsers, {
    'top users: status is 200': (r) => r.status === 200,
    'top users: response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(2);

  // 5. Consultar estadísticas de un grupo específico (50% de las veces)
  if (Math.random() < 0.5) {
    const groupStatsPayload = JSON.stringify({
      group_id: 'test-group-id',
      ...dateRange
    });

    const groupStats = http.post(
      `${SUPABASE_URL}/rest/v1/rpc/get_checkin_stats`,
      groupStatsPayload,
      { 
        headers,
        tags: { name: 'get_group_stats' }
      }
    );

    check(groupStats, {
      'group stats: status is 200': (r) => r.status === 200,
    });

    sleep(1);
  }
}

export function handleSummary(data) {
  console.log('\n=== CHECK-IN STATISTICS TEST SUMMARY ===');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
  
  if (data.metrics.stats_query_duration) {
    console.log(`\n📊 Stats Query Performance:`);
    console.log(`  Avg: ${data.metrics.stats_query_duration.values.avg.toFixed(2)}ms`);
    console.log(`  P95: ${data.metrics.stats_query_duration.values['p(95)'].toFixed(2)}ms`);
    console.log(`  Max: ${data.metrics.stats_query_duration.values.max.toFixed(2)}ms`);
  }
  
  if (data.metrics.heatmap_query_duration) {
    console.log(`\n🔥 Heatmap Query Performance:`);
    console.log(`  Avg: ${data.metrics.heatmap_query_duration.values.avg.toFixed(2)}ms`);
    console.log(`  P95: ${data.metrics.heatmap_query_duration.values['p(95)'].toFixed(2)}ms`);
    console.log(`  Max: ${data.metrics.heatmap_query_duration.values.max.toFixed(2)}ms`);
  }
  
  if (data.metrics.activity_query_duration) {
    console.log(`\n📈 Activity Query Performance:`);
    console.log(`  Avg: ${data.metrics.activity_query_duration.values.avg.toFixed(2)}ms`);
    console.log(`  P95: ${data.metrics.activity_query_duration.values['p(95)'].toFixed(2)}ms`);
  }
  
  if (data.metrics.stats_success_rate) {
    console.log(`\n✅ Success Rate: ${(data.metrics.stats_success_rate.values.rate * 100).toFixed(2)}%`);
  }
  
  console.log(`\n⚡ Overall Performance:`);
  console.log(`  Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`  P95 response time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  Failed requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log('=========================================\n');
  
  return {
    'stdout': '',
  };
}
