/**
 * Configuración compartida para tests de K6
 * 
 * Este archivo contiene configuraciones comunes que pueden ser
 * reutilizadas en múltiples tests.
 */

// URLs base
export const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
export const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://localhost:8080';

// API Keys
export const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;
export const USER_TOKEN = __ENV.USER_TOKEN;

// Headers comunes
export const supabaseHeaders = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export const authenticatedHeaders = (token = USER_TOKEN) => ({
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

// Thresholds comunes
export const defaultThresholds = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.95'],
};

export const permissiveThresholds = {
  http_req_duration: ['p(99)<1000'],
  http_req_failed: ['rate<0.05'],
  checks: ['rate>0.90'],
};

export const strictThresholds = {
  http_req_duration: ['p(95)<300'],
  http_req_failed: ['rate<0.001'],
  checks: ['rate>0.99'],
};

// Configuraciones de stages comunes
export const smokeStages = [
  { duration: '30s', target: 2 },
  { duration: '1m', target: 2 },
  { duration: '30s', target: 0 },
];

export const loadStages = [
  { duration: '2m', target: 50 },
  { duration: '5m', target: 50 },
  { duration: '2m', target: 100 },
  { duration: '3m', target: 100 },
  { duration: '2m', target: 0 },
];

export const stressStages = [
  { duration: '2m', target: 100 },
  { duration: '3m', target: 100 },
  { duration: '2m', target: 200 },
  { duration: '3m', target: 200 },
  { duration: '2m', target: 300 },
  { duration: '3m', target: 300 },
  { duration: '2m', target: 400 },
  { duration: '3m', target: 400 },
  { duration: '5m', target: 0 },
];

export const spikeStages = [
  { duration: '30s', target: 50 },
  { duration: '1m', target: 50 },
  { duration: '30s', target: 500 },
  { duration: '2m', target: 500 },
  { duration: '30s', target: 50 },
  { duration: '2m', target: 50 },
  { duration: '30s', target: 0 },
];

export const soakStages = [
  { duration: '5m', target: 400 },
  { duration: '3h55m', target: 400 },
  { duration: '5m', target: 0 },
];

// Endpoints comunes
export const endpoints = {
  // Endpoints básicos
  profiles: `${SUPABASE_URL}/rest/v1/profiles`,
  parkingSpots: `${SUPABASE_URL}/rest/v1/parking_spots`,
  reservations: `${SUPABASE_URL}/rest/v1/reservations`,
  parkingGroups: `${SUPABASE_URL}/rest/v1/parking_groups`,
  licensePlates: `${SUPABASE_URL}/rest/v1/license_plates`,
  incidents: `${SUPABASE_URL}/rest/v1/incident_reports`,
  userRoles: `${SUPABASE_URL}/rest/v1/user_roles`,
  userWarnings: `${SUPABASE_URL}/rest/v1/user_warnings`,
  auth: `${SUPABASE_URL}/auth/v1`,
  
  // Check-in/Check-out endpoints
  checkins: `${SUPABASE_URL}/rest/v1/reservation_checkins`,
  checkinInfractions: `${SUPABASE_URL}/rest/v1/checkin_infractions`,
  checkinSettings: `${SUPABASE_URL}/rest/v1/checkin_settings`,
  userBlocks: `${SUPABASE_URL}/rest/v1/user_blocks`,
  
  // Waitlist endpoints
  waitlistEntries: `${SUPABASE_URL}/rest/v1/waitlist_entries`,
  waitlistOffers: `${SUPABASE_URL}/rest/v1/waitlist_offers`,
  waitlistLogs: `${SUPABASE_URL}/rest/v1/waitlist_logs`,
  waitlistPenalties: `${SUPABASE_URL}/rest/v1/waitlist_penalties`,
  notifications: `${SUPABASE_URL}/rest/v1/notifications`,
  
  // RPC Functions - Check-in
  performCheckin: `${SUPABASE_URL}/rest/v1/rpc/perform_checkin`,
  performCheckout: `${SUPABASE_URL}/rest/v1/rpc/perform_checkout`,
  getCheckinStats: `${SUPABASE_URL}/rest/v1/rpc/get_checkin_stats`,
  getCheckinActivityByHour: `${SUPABASE_URL}/rest/v1/rpc/get_checkin_activity_by_hour`,
  getCheckinHeatmap: `${SUPABASE_URL}/rest/v1/rpc/get_checkin_heatmap`,
  getTopFastCheckinUsers: `${SUPABASE_URL}/rest/v1/rpc/get_top_fast_checkin_users`,
  
  // RPC Functions - Waitlist
  registerInWaitlist: `${SUPABASE_URL}/rest/v1/rpc/register_in_waitlist`,
  processWaitlistForSpot: `${SUPABASE_URL}/rest/v1/rpc/process_waitlist_for_spot`,
  acceptWaitlistOffer: `${SUPABASE_URL}/rest/v1/rpc/accept_waitlist_offer`,
  rejectWaitlistOffer: `${SUPABASE_URL}/rest/v1/rpc/reject_waitlist_offer`,
  calculateWaitlistPosition: `${SUPABASE_URL}/rest/v1/rpc/calculate_waitlist_position`,
  
  // RPC Functions - Incidents
  findAvailableSpotForIncident: `${SUPABASE_URL}/rest/v1/rpc/find_available_spot_for_incident`,
};

// Configuración de opciones por defecto
export const defaultOptions = {
  thresholds: defaultThresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};
