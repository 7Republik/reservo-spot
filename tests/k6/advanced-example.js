/**
 * ADVANCED EXAMPLE - Ejemplo Avanzado de Test
 * 
 * Este test demuestra el uso de:
 * - Configuración compartida
 * - Funciones helper
 * - Múltiples escenarios
 * - Métricas personalizadas
 * - Validaciones complejas
 * 
 * NO ejecutar en producción - Solo para aprendizaje
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Importar configuración y helpers
import { 
  SUPABASE_URL, 
  supabaseHeaders, 
  endpoints,
  defaultThresholds 
} from './utils/config.js';

import {
  checkSuccessfulResponse,
  checkFastResponse,
  generateFutureDate,
  randomSleep,
  printSummary,
  validateEnvVars
} from './utils/helpers.js';

// Validar variables de entorno requeridas
validateEnvVars(['SUPABASE_ANON_KEY']);

// Métricas personalizadas
const profilesCounter = new Counter('profiles_requests');
const spotsCounter = new Counter('spots_requests');
const reservationsCounter = new Counter('reservations_requests');
const responseTimeTrend = new Trend('custom_response_time');

// Configuración del test con múltiples escenarios
export const options = {
  scenarios: {
    // Escenario 1: Usuarios consultando perfiles
    profile_readers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'readProfiles',
    },
    
    // Escenario 2: Usuarios buscando plazas
    spot_searchers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 15 },
        { duration: '1m', target: 15 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'searchSpots',
      startTime: '10s', // Empieza 10s después
    },
    
    // Escenario 3: Usuarios consultando reservas
    reservation_checkers: {
      executor: 'constant-vus',
      vus: 5,
      duration: '2m',
      exec: 'checkReservations',
      startTime: '20s', // Empieza 20s después
    },
  },
  
  thresholds: {
    ...defaultThresholds,
    'profiles_requests': ['count>50'],
    'spots_requests': ['count>50'],
    'reservations_requests': ['count>20'],
    'custom_response_time': ['p(95)<600'],
  },
};

// Escenario 1: Leer perfiles
export function readProfiles() {
  const res = http.get(
    `${endpoints.profiles}?select=id,name,email&limit=20`,
    { headers: supabaseHeaders, tags: { scenario: 'profiles' } }
  );
  
  checkFastResponse(res, 'profiles', 500);
  profilesCounter.add(1);
  responseTimeTrend.add(res.timings.duration);
  
  sleep(randomSleep(1, 2));
}

// Escenario 2: Buscar plazas
export function searchSpots() {
  // 1. Listar grupos
  const groups = http.get(
    `${endpoints.parkingGroups}?select=id,name&is_active=eq.true`,
    { headers: supabaseHeaders, tags: { scenario: 'spots', action: 'list_groups' } }
  );
  
  checkSuccessfulResponse(groups, 'groups');
  
  sleep(0.5);
  
  // 2. Listar plazas disponibles
  const spots = http.get(
    `${endpoints.parkingSpots}?select=*&is_active=eq.true&limit=50`,
    { headers: supabaseHeaders, tags: { scenario: 'spots', action: 'list_spots' } }
  );
  
  checkFastResponse(spots, 'spots', 500);
  spotsCounter.add(1);
  responseTimeTrend.add(spots.timings.duration);
  
  sleep(randomSleep(1, 3));
}

// Escenario 3: Verificar reservas
export function checkReservations() {
  const futureDate = generateFutureDate(7);
  
  // Consultar reservas futuras
  const res = http.get(
    `${endpoints.reservations}?select=*,profiles(name),parking_spots(spot_number)` +
    `&reservation_date=gte.${futureDate}&order=reservation_date.asc&limit=30`,
    { headers: supabaseHeaders, tags: { scenario: 'reservations' } }
  );
  
  checkSuccessfulResponse(res, 'reservations');
  reservationsCounter.add(1);
  responseTimeTrend.add(res.timings.duration);
  
  sleep(randomSleep(2, 4));
}

// Función de setup (se ejecuta una vez al inicio)
export function setup() {
  console.log('🚀 Iniciando test avanzado...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  // Verificar conectividad
  const healthCheck = http.get(`${SUPABASE_URL}/rest/v1/`, {
    headers: supabaseHeaders,
  });
  
  if (healthCheck.status !== 200) {
    throw new Error('❌ Supabase no está accesible');
  }
  
  console.log('✅ Supabase accesible\n');
  
  return { startTime: Date.now() };
}

// Función de teardown (se ejecuta una vez al final)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n⏱️  Test completado en ${duration.toFixed(2)} segundos`);
}

// Summary personalizado
export function handleSummary(data) {
  printSummary(data, 'Advanced Test');
  
  // Análisis de escenarios
  console.log('📊 Análisis por Escenario:');
  console.log(`  - Profiles: ${data.metrics.profiles_requests?.values.count || 0} requests`);
  console.log(`  - Spots: ${data.metrics.spots_requests?.values.count || 0} requests`);
  console.log(`  - Reservations: ${data.metrics.reservations_requests?.values.count || 0} requests`);
  
  if (data.metrics.custom_response_time) {
    const customTime = data.metrics.custom_response_time.values;
    console.log(`\n⚡ Custom Response Time:`);
    console.log(`  - Avg: ${customTime.avg.toFixed(2)}ms`);
    console.log(`  - P95: ${customTime['p(95)'].toFixed(2)}ms`);
  }
  
  console.log('\n');
  
  return {
    'stdout': '',
  };
}
