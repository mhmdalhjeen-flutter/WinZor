/**
 * WinGold — Phase 2 authenticated read-only k6 smoke test
 *
 * GET only. No mutations, billing, exports, or order creation.
 *
 * Required:
 *   BASE_URL — e.g. https://winzor.onrender.com
 *
 * Optional (skip entire role if missing):
 *   CUSTOMER_TOKEN — customer JWT
 *   ADMIN_TOKEN    — admin JWT
 *   DELIVERY_TOKEN — delivery_company JWT
 *
 * Run:
 *   k6 run load-tests/smoke.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const baseUrl = (__ENV.BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

const customerToken = __ENV.CUSTOMER_TOKEN || '';
const adminToken = __ENV.ADMIN_TOKEN || '';
const deliveryToken = __ENV.DELIVERY_TOKEN || '';

const endpointChecks = new Rate('endpoint_checks_passed');
const roleEndpointMs = new Trend('role_endpoint_ms', true);
const roleEndpointFailed = new Counter('role_endpoint_failed');
const roleEndpointTotal = new Counter('role_endpoint_total');
const httpStatusCounter = new Counter('http_status');

const CUSTOMER_ENDPOINTS = [
  { name: 'users_me', path: '/api/users/me' },
  { name: 'users_me_center', path: '/api/users/me/center' },
  { name: 'users_me_point_sources', path: '/api/users/me/point-sources' },
  { name: 'users_me_legal', path: '/api/users/me/legal' },
  { name: 'users_me_admin_contact', path: '/api/users/me/admin-contact' },
  { name: 'orders_my', path: '/api/orders/my' },
  { name: 'orders_my_history', path: '/api/orders/my/history' },
  { name: 'notifications_unread_count', path: '/api/notifications/unread-count' },
  { name: 'notifications_list', path: '/api/notifications/' },
  { name: 'ratings_mine', path: '/api/ratings/mine' },
  { name: 'auth_verify_status', path: '/api/auth/verify/status' },
];

const ADMIN_ENDPOINTS = [
  { name: 'admin_sensitive_status', path: '/api/admin/sensitive/status' },
];

const DELIVERY_ENDPOINTS = [
  { name: 'delivery_company_regions', path: '/api/delivery/company/regions' },
  { name: 'delivery_company_profile', path: '/api/delivery/company/profile' },
  { name: 'delivery_company_requests', path: '/api/delivery/company/requests' },
];

export const options = {
  scenarios: {
    smoke_ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 1 },
        { duration: '30s', target: 2 },
        { duration: '30s', target: 3 },
        { duration: '30s', target: 5 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<5000', 'avg<3000'],
    endpoint_checks_passed: ['rate>0.95'],
    checks: ['rate>0.95'],
  },
};

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function recordStatus(status) {
  const bucket = status >= 500 ? '5xx' : status >= 400 ? '4xx' : status >= 300 ? '3xx' : '2xx';
  httpStatusCounter.add(1, { bucket, status: String(status) });
}

function hit(role, { name, path }, token) {
  const url = `${baseUrl}${path}`;
  const params = {
    headers: {
      Accept: 'application/json',
      ...authHeaders(token),
    },
    tags: { role, name, endpoint: path },
    timeout: '30s',
  };

  const start = Date.now();
  const res = http.get(url, params);
  const elapsed = Date.now() - start;

  recordStatus(res.status);
  roleEndpointTotal.add(1, { role, name, endpoint: path });
  roleEndpointMs.add(elapsed, { role, name, endpoint: path });

  const passed = check(res, {
    [`${name} status 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${name} not 5xx`]: (r) => r.status < 500,
    [`${name} body size reasonable`]: (r) => !r.body || r.body.length <= 1024 * 1024,
  });

  if (!passed || res.status >= 400) {
    roleEndpointFailed.add(1, { role, name, endpoint: path, status: String(res.status) });
  }

  endpointChecks.add(passed);
  return res;
}

function runRole(groupName, role, token, endpoints) {
  if (!token) return;

  group(groupName, () => {
    for (const ep of endpoints) {
      hit(role, ep, token);
      sleep(0.2);
    }
    sleep(0.5);
  });
}

export function setup() {
  const activeRoles = [];
  if (customerToken) activeRoles.push('customer');
  if (adminToken) activeRoles.push('admin');
  if (deliveryToken) activeRoles.push('delivery');

  console.log(`[phase2] BASE_URL=${baseUrl}`);
  console.log(`[phase2] active roles: ${activeRoles.length ? activeRoles.join(', ') : 'NONE — set CUSTOMER_TOKEN / ADMIN_TOKEN / DELIVERY_TOKEN'}`);
  console.log('[phase2] profile: ramp 1→2→3→5 VUs, GET only, authenticated read-only');

  return { activeRoles };
}

export default function phase2() {
  runRole('customer_authenticated', 'customer', customerToken, CUSTOMER_ENDPOINTS);
  runRole('admin_authenticated', 'admin', adminToken, ADMIN_ENDPOINTS);
  runRole('delivery_authenticated', 'delivery', deliveryToken, DELIVERY_ENDPOINTS);
  sleep(1);
}

function collectTaggedMetrics(data, metricName) {
  const prefix = `${metricName}{`;
  const rows = [];

  for (const [key, metric] of Object.entries(data.metrics || {})) {
    if (!key.startsWith(prefix)) continue;
    const tagStr = key.slice(prefix.length, -1);
    const tags = Object.fromEntries(
      tagStr.split(',').map((pair) => {
        const [k, v] = pair.split(':');
        return [k, v];
      }),
    );
    rows.push({ tags, values: metric.values || {} });
  }

  return rows;
}

function summarizeRole(rows, role) {
  const roleRows = rows.filter((r) => r.tags.role === role);
  if (!roleRows.length) {
    return { role, active: false, requests: 0, failures: 0, failureRate: 'n/a' };
  }

  let requests = 0;
  let failures = 0;
  const endpoints = [];

  for (const row of roleRows) {
    const count = row.values.count || 0;
    requests += count;
    endpoints.push({
      name: row.tags.name,
      path: row.tags.endpoint,
      count,
      avgMs: row.values.avg != null ? Math.round(row.values.avg) : null,
      p95Ms: row.values['p(95)'] != null ? Math.round(row.values['p(95)']) : null,
      maxMs: row.values.max != null ? Math.round(row.values.max) : null,
    });
  }

  return { role, active: true, requests, failures, failureRate: requests ? `${((failures / requests) * 100).toFixed(2)}%` : '0%', endpoints };
}

export function handleSummary(data) {
  const durationRows = collectTaggedMetrics(data, 'role_endpoint_ms');
  const failRows = collectTaggedMetrics(data, 'role_endpoint_failed');

  const failMap = new Map();
  for (const row of failRows) {
    const key = `${row.tags.role}|${row.tags.name}|${row.tags.endpoint}`;
    failMap.set(key, row.values.count || 0);
  }

  for (const row of durationRows) {
    const key = `${row.tags.role}|${row.tags.name}|${row.tags.endpoint}`;
    row.failures = failMap.get(key) || 0;
    row.failureRate = row.values.count ? `${(((row.failures || 0) / row.values.count) * 100).toFixed(2)}%` : '0%';
  }

  const statusRows = collectTaggedMetrics(data, 'http_status');
  const statusCounts = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
  const unexpected = [];

  for (const row of statusRows) {
    statusCounts[row.tags.bucket] = (statusCounts[row.tags.bucket] || 0) + (row.values.count || 0);
    const code = Number(row.tags.status);
    if (code === 429 || code >= 500) {
      unexpected.push({ status: code, count: row.values.count || 0 });
    } else if (code >= 400) {
      unexpected.push({ status: code, count: row.values.count || 0 });
    }
  }

  const customer = summarizeRole(durationRows, 'customer');
  const admin = summarizeRole(durationRows, 'admin');
  const delivery = summarizeRole(durationRows, 'delivery');

  const endpointReport = durationRows
    .map((row) => ({
      role: row.tags.role,
      name: row.tags.name,
      path: row.tags.endpoint,
      requests: row.values.count || 0,
      avgMs: row.values.avg != null ? Math.round(row.values.avg) : null,
      p95Ms: row.values['p(95)'] != null ? Math.round(row.values['p(95)']) : null,
      maxMs: row.values.max != null ? Math.round(row.values.max) : null,
      failures: row.failures || 0,
      failureRate: row.failureRate,
    }))
    .sort((a, b) => (b.maxMs || 0) - (a.maxMs || 0));

  const totalReqs = data.metrics.http_reqs?.values?.count || 0;
  const failedRate = data.metrics.http_req_failed?.values?.rate || 0;
  const successfulReqs = Math.round(totalReqs * (1 - failedRate));
  const failedReqs = totalReqs - successfulReqs;

  const report = {
    phase: 2,
    baseUrl,
    roles: { customer, admin, delivery },
    endpoints: endpointReport,
    statusCounts,
    unexpectedStatuses: unexpected,
    totals: {
      requests: totalReqs,
      successful: successfulReqs,
      failed: failedReqs,
      httpReqFailedRate: failedRate,
      avgMs: data.metrics.http_req_duration?.values?.avg,
      p90Ms: data.metrics.http_req_duration?.values?.['p(90)'],
      p95Ms: data.metrics.http_req_duration?.values?.['p(95)'],
      maxMs: data.metrics.http_req_duration?.values?.max,
      checksRate: data.metrics.checks?.values?.rate,
    },
  };

  const lines = [
    '',
    '=== WinGold k6 Phase 2 summary ===',
    `BASE_URL: ${baseUrl}`,
    `total requests: ${totalReqs}`,
    `successful: ${successfulReqs}`,
    `failed: ${failedReqs}`,
    `2xx/3xx/4xx/5xx: ${statusCounts['2xx']}/${statusCounts['3xx']}/${statusCounts['4xx']}/${statusCounts['5xx']}`,
    `http_req_failed: ${(failedRate * 100).toFixed(2)}%`,
    `avg: ${Math.round(report.totals.avgMs || 0)} ms`,
    `p90: ${Math.round(report.totals.p90Ms || 0)} ms`,
    `p95: ${Math.round(report.totals.p95Ms || 0)} ms`,
    `max: ${Math.round(report.totals.maxMs || 0)} ms`,
    `checks: ${((report.totals.checksRate || 0) * 100).toFixed(2)}%`,
    '',
    'Per-role:',
    `  customer: active=${customer.active} requests=${customer.requests}`,
    `  admin: active=${admin.active} requests=${admin.requests}`,
    `  delivery: active=${delivery.active} requests=${delivery.requests}`,
    '',
    'Per-endpoint (sorted by max latency):',
    ...endpointReport.map(
      (e) =>
        `  [${e.role}] ${e.path} — req=${e.requests} avg=${e.avgMs}ms p95=${e.p95Ms}ms max=${e.maxMs}ms fail=${e.failures} (${e.failureRate})`,
    ),
    '',
  ];

  return {
    stdout: lines.join('\n'),
    'load-tests/summary-phase2.json': JSON.stringify(report, null, 2),
  };
}
