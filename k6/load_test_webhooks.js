import http from 'k6/http';
import { check, sleep } from 'k6';

// Facttic Voice Ingestion & Risk Scoring Resiliency Test
// Simulates concurrent webhook payloads stressing Postgres connection pools & Data Residency routers.

const BASE_URL = __ENV.FACTTIC_API_URL || 'http://localhost:3000/api';
const __TEST_TYPE = __ENV.TEST_TYPE || 'steady'; // 'steady', 'stress', 'spike', 'soak'

export function setup() {
  console.log(`Starting ${__TEST_TYPE} load test against ${BASE_URL}`);
  return { testType: __TEST_TYPE };
}

// Generates a mock Vapi payload mapping the standard voice schema
function generateVapiPayload() {
  return JSON.stringify({
    message: {
      type: 'end-of-call-report',
      call: {
        id: `k6-test-${Math.floor(Math.random() * 1000000)}`,
        orgId: 'org-enterprise-load-1',
        startedAt: new Date().toISOString(),
        endedAt: new Date(Date.now() + 150000).toISOString(),
        duration: 150
      },
      transcript: 'This is a simulated conversation representing automated bulk ingests mapping strictly to PII heuristics and Compliance bounds.',
      recordingUrl: 'https://vapi.ai/mock/audio.wav'
    }
  });
}

// 1. STEADY LOAD (Baseline Performance)
const steadyOptions = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 concurrent data-streams
    { duration: '3m', target: 50 },   // Maintain peak baseline
    { duration: '30s', target: 0 },   // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.001'],  // < 0.1% errors
  },
};

// 2. STRESS TEST (Finding the Breaking Point)
const stressOptions = {
  stages: [
    { duration: '1m', target: 100 },  // Normal load
    { duration: '2m', target: 100 },
    { duration: '1m', target: 300 },  // High load
    { duration: '2m', target: 300 },
    { duration: '1m', target: 500 },  // Extreme load
    { duration: '2m', target: 500 },
    { duration: '1m', target: 0 },    // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // Relaxed during stress
    http_req_failed: ['rate<0.01'],    // < 1% errors tolerant under stress
  },
};

// 3. SPIKE TEST (Sudden Surges)
const spikeOptions = {
  stages: [
    { duration: '10s', target: 50 },   // Warm up
    { duration: '1m', target: 50 },
    { duration: '10s', target: 600 },  // Instant spike
    { duration: '2m', target: 600 },   // Hold spike
    { duration: '10s', target: 50 },   // Instant drop
    { duration: '1m', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.005'],
  },
};

// 4. SOAK TEST (Long-term Reliability & Memory Leaks)
const soakOptions = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '4h', target: 100 },   // Sustain for 4 hours
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.001'],
  },
};

// Dynamically select options based on env var
export let options = steadyOptions;
if (__TEST_TYPE === 'stress') options = stressOptions;
if (__TEST_TYPE === 'spike') options = spikeOptions;
if (__TEST_TYPE === 'soak') options = soakOptions;


export default function () {
  const payload = generateVapiPayload();
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      // Simulates the API gateway checking the pre-shared Webhook Secret
      'Authorization': `Bearer ${__ENV.FACTTIC_WEBHOOK_SECRET || 'test-secret'}`,
      // Enforce the BYOK standard mapping for enterprise testing
      'x-byok-key': 'test-byok-encryption-key-k6-mock'
    },
  };

  const res = http.post(`${BASE_URL}/webhooks/voice`, payload, params);

  check(res, {
    'ingestion successful (200)': (r) => r.status === 200,
  });

  // Brief pause mimicking staggered transmission
  sleep(Math.random() * 2);
}
