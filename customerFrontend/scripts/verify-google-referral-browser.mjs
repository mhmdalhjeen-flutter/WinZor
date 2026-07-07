/**
 * Browser verification: referral storage + POST /auth/google payload.
 * Uses a fresh browser context (incognito equivalent).
 * Intercepts /auth/google to capture the request body without real Google OAuth.
 */
import { chromium } from 'playwright';

const FRONTEND = process.env.VERIFY_FRONTEND_URL || 'http://127.0.0.1:5173';
const REF_CODE = process.env.VERIFY_REF_CODE || 'BROWSERREF01';

async function main() {
  const report = {
    frontendUrl: FRONTEND,
    invitationLink: `${FRONTEND}/intro?ref=${encodeURIComponent(REF_CODE)}`,
    sessionStorageAfterIntro: null,
    sessionStorageAfterRegisterNav: null,
    capturedAuthGoogleBody: null,
    authGoogleIntercepted: false,
    errors: [],
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route('**/api/auth/google', async (route) => {
    const request = route.request();
    let body = null;
    try {
      body = request.postDataJSON();
    } catch {
      body = request.postData();
    }
    report.capturedAuthGoogleBody = body;
    report.authGoogleIntercepted = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'mock-token',
        refreshToken: 'mock-refresh',
        deviceId: body?.deviceId || 'mock-device',
        user: { id: 'mock-user', role: 'customer', email: 'mock@test.com' },
      }),
    });
  });

  try {
    await page.goto(report.invitationLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
    report.sessionStorageAfterIntro = await page.evaluate(() => ({
      referralCode: sessionStorage.getItem('referralCode'),
    }));

    await page.evaluate(() => {
      sessionStorage.setItem('referralIntroSeen', 'true');
    });
    await page.goto(`${FRONTEND}/register?ref=${encodeURIComponent(REF_CODE)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    report.sessionStorageAfterRegisterNav = await page.evaluate(() => ({
      referralCode: sessionStorage.getItem('referralCode'),
    }));

    await page.evaluate(async () => {
      const mod = await import('/src/services/authService.js');
      await mod.googleAuth('synthetic-credential-for-payload-check');
    });

    if (!report.authGoogleIntercepted) {
      report.errors.push('POST /auth/google was not intercepted');
    }
  } catch (err) {
    report.errors.push(String(err.message || err));
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(report, null, 2));
  const ok =
    report.sessionStorageAfterIntro?.referralCode === REF_CODE &&
    report.sessionStorageAfterRegisterNav?.referralCode === REF_CODE &&
    report.capturedAuthGoogleBody?.referralCode === REF_CODE &&
    report.capturedAuthGoogleBody?.credential === 'synthetic-credential-for-payload-check';

  process.exitCode = ok && report.errors.length === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
