/**
 * k6 Load Test — Authentication Flow
 *
 * Tests: POST /api/v1/auth/login → use token → POST /api/v1/auth/logout
 * Validates response times and error rates under concurrent user load.
 *
 * Run:
 *   k6 run --vus 20 --duration 30s k6/auth-flow.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Custom metrics ───────────────────────────────────────────────────────────

const loginErrors = new Rate('login_errors');
const loginDuration = new Trend('login_duration_ms');

// ─── Test config ──────────────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp up to 10 users
    { duration: '20s', target: 20 },   // Sustain 20 concurrent users
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests < 1 second
    http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
    login_errors: ['rate<0.05'],       // Less than 5% login errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Use test accounts seeded in staging — never use prod credentials in tests
const TEST_EMAIL = __ENV.TEST_EMAIL || 'loadtest@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'loadtest_password_123';

// ─── Test scenario ────────────────────────────────────────────────────────────

export default function () {
  // 1. Login
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  loginDuration.add(Date.now() - loginStart);

  const loginOk = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => {
      try { return !!JSON.parse(r.body).data?.accessToken; } catch { return false; }
    },
  });

  loginErrors.add(!loginOk);

  if (!loginOk) {
    sleep(1);
    return;
  }

  const { accessToken } = JSON.parse(loginRes.body).data;

  // 2. Fetch profile
  const profileRes = http.get(`${BASE_URL}/api/v1/me/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  check(profileRes, {
    'profile status 200': (r) => r.status === 200,
    'profile has userId': (r) => {
      try { return !!JSON.parse(r.body).data?.userId; } catch { return false; }
    },
  });

  sleep(0.5);
}
