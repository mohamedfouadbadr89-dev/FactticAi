import http from 'k6/http';
import { check } from 'k6';

/**
 * Facttic AI Governance - k6 Load Testing Suite v1
 * 
 * Execution Scenarios: 100, 500, and 1000 requests per second.
 * Validates the async persistence architecture and Node.js event-loop resilience.
 * 
 * Run via: 
 * k6 run tests/load/k6_suite.js
 */

export const options = {
  scenarios: {
    load_100_reqs: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 100,
      maxVUs: 500,
      tags: { target: '100_rps' }
    },
    load_500_reqs: {
      executor: 'constant-arrival-rate',
      rate: 500,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 500,
      maxVUs: 1500,
      startTime: '1m30s', // Buffer to let system rest
      tags: { target: '500_rps' }
    },
    load_1000_reqs: {
      executor: 'constant-arrival-rate',
      rate: 1000,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 1000,
      maxVUs: 3000,
      startTime: '3m',
      tags: { target: '1000_rps' }
    }
  },
  thresholds: {
    'http_req_duration': ['p(99)<50'], // 99% of requests must complete below 50ms
    'http_req_failed': ['rate<0.01'],  // Error rate must be < 1%
  }
};

const BASE_URL = __ENV.FACTTIC_API_URL || 'http://localhost:3000';
// Mock session credentials for load testing
const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'mock-loadtest-token'}`
};

export default function () {
  const sessionId = `k6-session-${Math.floor(Math.random() * 100000)}`;

  // 1. Text Agent / Chat Route
  const chatRes = http.post(`${BASE_URL}/api/chat`, JSON.stringify({
    messages: [{ role: 'user', content: 'Generate a summary for this load test.' }]
  }), { headers: AUTH_HEADERS });
  
  check(chatRes, { 'chat status 200': (r) => r.status === 200 });

  // 2. Direct Governance Execution Route
  const govRes = http.post(`${BASE_URL}/api/governance/execute`, JSON.stringify({
    org_id: 'test-org',
    session_id: sessionId,
    prompt: 'Load testing the fast-path risk calculation.',
    model: 'load-tester-v1'
  }), { headers: AUTH_HEADERS });
  
  check(govRes, { 'governance status 200': (r) => r.status === 200 });

  // 3. Voice Stream (Legacy Fallback API Payload Simulation)
  const voiceRes = http.post(`${BASE_URL}/api/voice/stream`, JSON.stringify({
    session_id: sessionId,
    speaker: 'user',
    start_ms: 100,
    end_ms: 1500,
    transcript_delta: 'This is a simulated audio chunk.'
  }), { headers: AUTH_HEADERS });
  
  check(voiceRes, { 'voice stream status 200': (r) => r.status === 200 });
}
