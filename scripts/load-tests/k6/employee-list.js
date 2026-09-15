/**
 * k6 Load Test — Employee List
 *
 * Tests: GET /api/v1/employees?page=1&limit=20
 * Simulates HR managers browsing the employee directory under load.
 *
 * Run:
 *   k6 run --vus 30 --duration 60s \
 *     -e BASE_URL=http://localhost:3000 \
 *     -e ACCESS_TOKEN=<your-token> \
 *     -e TENANT_SLUG=your-tenant \
 *     k6/employee-list.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const listDuration = new Trend('employee_list_duration_ms');
const listErrors = new Rate('employee_list_errors');

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    employee_list_errors: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN || '';
const TENANT_SLUG = __ENV.TENANT_SLUG || 'demo';

export default function () {
  const page = Math.floor(Math.random() * 5) + 1;

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/api/v1/t/${TENANT_SLUG}/employees?page=${page}&limit=20`,
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  );
  listDuration.add(Date.now() - start);

  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'has data array': (r) => {
      try { return Array.isArray(JSON.parse(r.body).data); } catch { return false; }
    },
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  listErrors.add(!ok);
  sleep(0.2 + Math.random() * 0.3); // 200-500ms think time
}
