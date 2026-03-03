import http from 'k6/http';
import { check, sleep } from 'k6';

// Facttic Voice Ingestion Resiliency Test
// Simulates concurrent webhook payloads stressing Postgres connection pools & Data Residency routers.

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 concurrent data-streams
    { duration: '1m', target: 50 },   // Maintain peak baseline
    { duration: '30s', target: 200 }, // Spike workload mimicking Enterprise Bulk import
    { duration: '1m', target: 200 },  // Maintain Spike
    { duration: '30s', target: 0 },   // Cool-down
  ],
  thresholds: {
    // API should respond under 500ms 95% of the time, even during spikes
    http_req_duration: ['p(95)<500'],
    // Ensure 99.9% of webhooks return a 200 or 201 Success binding
    http_req_failed: ['rate<0.001'],
  },
};

const BASE_URL = __ENV.FACTTIC_API_URL || 'http://localhost:3000/api';

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
      transcript: 'This is a simulated conversation representing automated bulk ingests.',
      recordingUrl: 'https://vapi.ai/mock/audio.wav'
    }
  });
}

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
    'ingestion latency < 350ms': (r) => r.timings.duration < 350,
  });

  // Brief pause mimicking staggered transmission
  sleep(Math.random() * 2);
}
