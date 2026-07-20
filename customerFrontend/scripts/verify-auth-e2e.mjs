/**
 * End-to-end auth verification — local dev + Netlify production.
 * Run: node scripts/verify-auth-e2e.mjs
 */
import { chromium } from 'playwright';

const TS = Date.now();
const TEST_EMAIL = `authverify${TS}@mail.test`;
const TEST_PASSWORD = 'VerifyAuth1';
const TEST_NAME = 'Auth Verify User';

const API_BASE = 'https://winzor.onrender.com/api';
const LOCAL_API = 'http://127.0.0.1:5000/api';

const ENVIRONMENTS = [
  {
    name: 'local-dev',
    frontendUrl: 'http://127.0.0.1:5173',
    apiBase: API_BASE,
  },
  {
    name: 'netlify-production',
    frontendUrl: 'https://win-gold-shopping.mhmdalhjeen.workers.dev',
    apiBase: API_BASE,
  },
];

async function registerTestUser(apiBase) {
  const deviceId = crypto.randomUUID();
  const res = await fetch(`${apiBase}/auth/register-customer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': deviceId,
    },
    body: JSON.stringify({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId,
    }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, deviceId };
}

async function apiLogin(apiBase, deviceId) {
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': deviceId,
    },
    body: JSON.stringify({
      identifier: TEST_EMAIL,
      password: TEST_PASSWORD,
      appType: 'customer',
      deviceId,
    }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, headers: Object.fromEntries(res.headers.entries()) };
}

async function probeAuthedEndpoints(apiBase, token, deviceId) {
  const endpoints = [
    { method: 'GET', path: '/users/me' },
    { method: 'GET', path: '/notifications/unread-count' },
    { method: 'GET', path: '/chats/unread-count' },
    { method: 'GET', path: '/cart' },
    { method: 'GET', path: '/activity/favorites' },
    { method: 'GET', path: '/notifications?unread=true&limit=15' },
    { method: 'GET', path: '/auth/verify/status' },
  ];

  const results = [];
  for (const ep of endpoints) {
    const res = await fetch(`${apiBase}${ep.path}`, {
      method: ep.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-device-id': deviceId,
      },
    });
    const body = await res.json().catch(() => null);
    results.push({
      endpoint: `${ep.method} ${ep.path}`,
      status: res.status,
      body: res.status >= 400 ? body : { ok: true, keys: body && typeof body === 'object' ? Object.keys(body).slice(0, 8) : null },
    });
  }
  return results;
}

async function runBrowserScenario(env) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const networkLog = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('/api/')) return;
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    networkLog.push({
      url,
      status: response.status(),
      method: response.request().method(),
      body: response.status() >= 400 ? body : { ok: true },
    });
  });

  const report = {
    environment: env.name,
    frontendUrl: env.frontendUrl,
    steps: {},
    networkAfterLogin: [],
    errors: [],
  };

  try {
    await page.goto(`${env.frontendUrl}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    report.steps.loginPageLoaded = page.url();

    await page.locator('input[autocomplete="username"], input[type="text"]').first().fill(TEST_EMAIL);
    await page.locator('input[autocomplete="current-password"], input[type="password"]').first().fill(TEST_PASSWORD);

    const loginResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/auth/login') && r.request().method() === 'POST',
      { timeout: 60000 }
    );

    await page.locator('button[type="submit"]').first().click();
    const loginResponse = await loginResponsePromise;
    const loginBody = await loginResponse.json().catch(() => null);

    report.steps.loginRequest = {
      url: loginResponse.url(),
      status: loginResponse.status(),
      body: {
        message: loginBody?.message,
        hasToken: Boolean(loginBody?.token),
        tokenPrefix: loginBody?.token ? `${loginBody.token.slice(0, 20)}...` : null,
        userRole: loginBody?.user?.role,
        deviceId: loginBody?.deviceId,
      },
    };

    await page.waitForTimeout(3000);
    report.steps.urlAfterLogin = page.url();

    const storage = await page.evaluate(() => ({
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
      deviceId: localStorage.getItem('deviceId'),
    }));

    report.steps.localStorage = {
      hasToken: Boolean(storage.token && storage.token !== 'undefined'),
      tokenPrefix: storage.token ? `${storage.token.slice(0, 20)}...` : null,
      userRole: (() => {
        try {
          return JSON.parse(storage.user || 'null')?.role;
        } catch {
          return null;
        }
      })(),
      deviceId: storage.deviceId,
    };

    report.steps.staysOffLogin = !page.url().includes('/login');
    report.steps.onHome = page.url().replace(/\/$/, '').endsWith(env.frontendUrl.replace(/\/$/, '')) || page.url() === `${env.frontendUrl}/`;

    await page.goto(`${env.frontendUrl}/draws`, { waitUntil: 'networkidle', timeout: 60000 });
    report.steps.protectedRouteUrl = page.url();
    report.steps.protectedRouteAllowed = !page.url().includes('/login');

    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    report.steps.urlAfterRefresh = page.url();
    report.steps.stillLoggedInAfterRefresh = !page.url().includes('/login') && Boolean(await page.evaluate(() => localStorage.getItem('token')));

    await page.goto(`${env.frontendUrl}/`, { waitUntil: 'networkidle', timeout: 60000 });
    report.steps.rootAfterRefresh = page.url();
    report.steps.rootNoLoginRedirect = !page.url().includes('/login');

    report.networkAfterLogin = networkLog.filter((n) => n.status >= 400);
    report.allApiCalls = networkLog.map((n) => ({ url: n.url.replace(/^https?:\/\/[^/]+/, ''), status: n.status, method: n.method }));
  } catch (err) {
    report.errors.push(String(err.message || err));
  } finally {
    await browser.close();
  }

  return report;
}

async function main() {
  console.log('=== Auth E2E Verification ===');
  console.log(`Test user: ${TEST_EMAIL}`);

  // Register once against production API (shared DB)
  const regProd = await registerTestUser(API_BASE);
  console.log('\n--- Register (production API) ---');
  console.log(JSON.stringify({ status: regProd.status, message: regProd.body?.message, hasToken: Boolean(regProd.body?.token) }, null, 2));

  const deviceId = regProd.deviceId;
  let token = regProd.body?.token;

  if (!token) {
    const loginApi = await apiLogin(API_BASE, deviceId);
    console.log('\n--- API Login (production API) ---');
    console.log(JSON.stringify({ status: loginApi.status, message: loginApi.body?.message, hasToken: Boolean(loginApi.body?.token) }, null, 2));
    token = loginApi.body?.token;
  }

  if (token) {
    const probes = await probeAuthedEndpoints(API_BASE, token, deviceId);
    console.log('\n--- Post-login API probes (production API) ---');
    for (const p of probes) {
      console.log(JSON.stringify(p, null, 2));
    }
  }

  // Local API probe if backend running
  try {
    const localLogin = await apiLogin(LOCAL_API, deviceId);
    console.log('\n--- API Login (local API :5000) ---');
    console.log(JSON.stringify({ status: localLogin.status, message: localLogin.body?.message, hasToken: Boolean(localLogin.body?.token) }, null, 2));
    if (localLogin.body?.token) {
      const localProbes = await probeAuthedEndpoints(LOCAL_API, localLogin.body.token, deviceId);
      console.log('\n--- Post-login API probes (local API) ---');
      for (const p of localProbes) {
        console.log(JSON.stringify(p, null, 2));
      }
    }
  } catch (e) {
    console.log('\n--- Local API unavailable ---', e.message);
  }

  for (const env of ENVIRONMENTS) {
    console.log(`\n${'='.repeat(60)}\nBrowser test: ${env.name}\n${'='.repeat(60)}`);
    try {
      const report = await runBrowserScenario(env);
      console.log(JSON.stringify(report, null, 2));
    } catch (e) {
      console.log('Browser test failed:', e.message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
