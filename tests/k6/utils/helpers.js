/**
 * Funciones helper para tests de K6
 * 
 * Utilidades comunes que pueden ser reutilizadas en múltiples tests.
 */

import { check } from 'k6';

/**
 * Valida que una respuesta HTTP sea exitosa
 * @param {Response} response - Respuesta HTTP de K6
 * @param {string} name - Nombre del check para identificación
 * @returns {boolean} - True si todos los checks pasaron
 */
export function checkSuccessfulResponse(response, name = 'request') {
  return check(response, {
    [`${name}: status is 200`]: (r) => r.status === 200,
    [`${name}: response time < 1s`]: (r) => r.timings.duration < 1000,
    [`${name}: has body`]: (r) => r.body && r.body.length > 0,
  });
}

/**
 * Valida que una respuesta HTTP sea exitosa con tiempo de respuesta específico
 * @param {Response} response - Respuesta HTTP de K6
 * @param {string} name - Nombre del check
 * @param {number} maxDuration - Duración máxima en ms
 * @returns {boolean} - True si todos los checks pasaron
 */
export function checkFastResponse(response, name = 'request', maxDuration = 500) {
  return check(response, {
    [`${name}: status is 200`]: (r) => r.status === 200,
    [`${name}: response time < ${maxDuration}ms`]: (r) => r.timings.duration < maxDuration,
  });
}

/**
 * Valida que una respuesta de autenticación sea exitosa
 * @param {Response} response - Respuesta HTTP de K6
 * @returns {boolean} - True si todos los checks pasaron
 */
export function checkAuthResponse(response) {
  return check(response, {
    'auth: status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'auth: has response': (r) => r.body && r.body.length > 0,
  });
}

/**
 * Valida que una respuesta de creación sea exitosa
 * @param {Response} response - Respuesta HTTP de K6
 * @param {string} name - Nombre del recurso creado
 * @returns {boolean} - True si todos los checks pasaron
 */
export function checkCreateResponse(response, name = 'resource') {
  return check(response, {
    [`${name}: status is 201`]: (r) => r.status === 201,
    [`${name}: has id`]: (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && (body.id || (Array.isArray(body) && body[0]?.id));
      } catch {
        return false;
      }
    },
  });
}

/**
 * Valida que una respuesta de actualización sea exitosa
 * @param {Response} response - Respuesta HTTP de K6
 * @param {string} name - Nombre del recurso actualizado
 * @returns {boolean} - True si todos los checks pasaron
 */
export function checkUpdateResponse(response, name = 'resource') {
  return check(response, {
    [`${name}: status is 200 or 204`]: (r) => r.status === 200 || r.status === 204,
  });
}

/**
 * Valida que una respuesta de eliminación sea exitosa
 * @param {Response} response - Respuesta HTTP de K6
 * @param {string} name - Nombre del recurso eliminado
 * @returns {boolean} - True si todos los checks pasaron
 */
export function checkDeleteResponse(response, name = 'resource') {
  return check(response, {
    [`${name}: status is 204`]: (r) => r.status === 204,
  });
}

/**
 * Genera un email único para testing
 * @param {number} vu - Número de VU (Virtual User)
 * @param {number} iter - Número de iteración
 * @returns {string} - Email único
 */
export function generateUniqueEmail(vu, iter) {
  return `test-user-${vu}-${iter}-${Date.now()}@example.com`;
}

/**
 * Genera una matrícula aleatoria
 * @returns {string} - Matrícula en formato español
 */
export function generateLicensePlate() {
  const numbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                  String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                  String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${numbers}${letters}`;
}

/**
 * Genera una fecha futura aleatoria
 * @param {number} daysAhead - Días en el futuro (default: 7)
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
export function generateFutureDate(daysAhead = 7) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  return date.toISOString().split('T')[0];
}

/**
 * Pausa aleatoria entre min y max segundos
 * @param {number} min - Mínimo de segundos
 * @param {number} max - Máximo de segundos
 * @returns {number} - Segundos a pausar
 */
export function randomSleep(min = 1, max = 3) {
  return min + Math.random() * (max - min);
}

/**
 * Parsea el body de una respuesta JSON de forma segura
 * @param {Response} response - Respuesta HTTP de K6
 * @returns {Object|null} - Objeto parseado o null si falla
 */
export function safeParseJSON(response) {
  try {
    return JSON.parse(response.body);
  } catch (error) {
    console.error(`Error parsing JSON: ${error.message}`);
    return null;
  }
}

/**
 * Extrae el ID de una respuesta de creación
 * @param {Response} response - Respuesta HTTP de K6
 * @returns {string|null} - ID extraído o null
 */
export function extractId(response) {
  const body = safeParseJSON(response);
  if (!body) return null;
  
  if (body.id) return body.id;
  if (Array.isArray(body) && body[0]?.id) return body[0].id;
  
  return null;
}

/**
 * Crea un resumen personalizado de métricas
 * @param {Object} data - Datos del summary de K6
 * @param {string} testName - Nombre del test
 */
export function printSummary(data, testName = 'Test') {
  console.log(`\n=== ${testName.toUpperCase()} SUMMARY ===`);
  
  if (data.metrics.http_reqs) {
    console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
    console.log(`Requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
  }
  
  if (data.metrics.http_req_failed) {
    const failedCount = data.metrics.http_req_failed.values.passes || 0;
    const failedRate = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
    console.log(`Failed requests: ${failedCount} (${failedRate}%)`);
  }
  
  if (data.metrics.http_req_duration) {
    const duration = data.metrics.http_req_duration.values;
    console.log(`Avg response time: ${duration.avg.toFixed(2)}ms`);
    console.log(`P95 response time: ${duration['p(95)'].toFixed(2)}ms`);
    console.log(`P99 response time: ${duration['p(99)'].toFixed(2)}ms`);
    console.log(`Max response time: ${duration.max.toFixed(2)}ms`);
  }
  
  if (data.metrics.checks) {
    const checksRate = (data.metrics.checks.values.rate * 100).toFixed(2);
    console.log(`Checks passed: ${checksRate}%`);
  }
  
  if (data.metrics.vus_max) {
    console.log(`Max VUs: ${data.metrics.vus_max.values.max}`);
  }
  
  console.log('='.repeat(testName.length + 20) + '\n');
}

/**
 * Valida que las variables de entorno requeridas estén configuradas
 * @param {Array<string>} requiredVars - Array de nombres de variables requeridas
 * @throws {Error} - Si alguna variable no está configurada
 */
export function validateEnvVars(requiredVars) {
  const missing = requiredVars.filter(varName => !__ENV[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please configure them in .env.k6 file'
    );
  }
}
