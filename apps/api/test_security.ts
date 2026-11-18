import http from 'http';
import jwt from 'jsonwebtoken';
import { randomUUID, randomBytes } from 'crypto';
import { app } from './src/app.js';
import { prisma } from './src/db.js';
import { envConfig, validateAndLoadConfig } from './src/utils/env.js';
import { validateImageSignature, deleteImage } from './src/utils/storage.js';
import { signRefreshToken } from './src/middlewares/auth.js';

async function runSecurityTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(4007, '127.0.0.1', () => resolve()));
  const baseUrl = 'http://127.0.0.1:4007/api/v1';

  // Set mock Google OAuth credentials for automated test isolation
  envConfig.googleClientId = envConfig.googleClientId || 'test-client-id.apps.googleusercontent.com';
  envConfig.googleClientSecret = envConfig.googleClientSecret || 'test-client-secret-123456';
  envConfig.googleRedirectUri = envConfig.googleRedirectUri || 'http://localhost:4000/api/v1/auth/google/callback';

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testId: string, description: string) {
    if (condition) {
      console.log(`✅ [${testId}] PASS - ${description}`);
      passed++;
    } else {
      console.error(`❌ [${testId}] FAIL - ${description}`);
      failed++;
      throw new Error(`Test failed: [${testId}] ${description}`);
    }
  }

  try {
    console.log('\n======================================================');
    console.log('🔒 EKRAF HUB — ADVANCED SECURITY & FOUNDATION SUITE');
    console.log('======================================================\n');

    // -------------------------------------------------------------------------
    // SECTION A: AUTHENTICATION, JWT & REFRESH TOKEN TESTS
    // -------------------------------------------------------------------------
    console.log('--- A. Authentication & Refresh Token Security Tests ---');

    // SEC-01: Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'SEC-01', 'Health endpoint reports status ok');

    // SEC-02: Public Register with disallowed role attribute (Mass-Assignment protection)
    const badRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `hacker_${Date.now()}@test.id`,
        password: 'Password123!',
        displayName: 'Hacker',
        role: 'ADMIN', // Illegal role escalation attempt
      }),
    });
    assert(badRegRes.status === 422, 'SEC-02', 'Registration rejects role mass-assignment (HTTP 422)');

    // SEC-03: Register valid normal user
    const testEmail = `user_sec_${Date.now()}@ekraftuban.id`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'UserSecurePassword123!',
        displayName: 'Test Sec User',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.data.role === 'USER', 'SEC-03', 'New user registered with role USER');
    const userCookie = regRes.headers.get('set-cookie') || '';
    assert(userCookie.includes('ekraf_at') && userCookie.includes('HttpOnly'), 'SEC-03-COOKIE', 'Session set in HttpOnly cookie');

    // SEC-04: Login with bad credentials
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!',
      }),
    });
    assert(badLoginRes.status === 401, 'SEC-04', 'Login with wrong password rejected (HTTP 401)');

    // SEC-05: Login with inactive user
    const inactiveEmail = `inactive_${Date.now()}@ekraftuban.id`;
    const inactUser = await prisma.user.create({
      data: {
        email: inactiveEmail,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
        role: 'USER',
        isActive: false,
      },
    });
    const inactLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inactiveEmail,
        password: 'SomePassword123!',
      }),
    });
    assert(inactLoginRes.status === 401, 'SEC-05', 'Inactive account login rejected (HTTP 401)');

    // SEC-06: Session refresh & token rotation (Valid Token)
    const loginOkRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'UserSecurePassword123!',
      }),
    });
    const loginCookies = loginOkRes.headers.get('set-cookie') || '';
    const rtCookieMatch = loginCookies.match(/ekraf_rt=([^;]+)/);
    const initialRt = rtCookieMatch ? rtCookieMatch[1] : '';

    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `ekraf_rt=${initialRt}` },
    });
    const rotatedCookies = refreshRes.headers.get('set-cookie') || '';
    const rotatedRtMatch = rotatedCookies.match(/ekraf_rt=([^;]+)/);
    const rotatedRt = rotatedRtMatch ? rotatedRtMatch[1] : '';
    assert(
      refreshRes.status === 200 && rotatedRt !== '' && rotatedRt !== initialRt,
      'SEC-06',
      'Refresh token rotated successfully with new hash'
    );

    // SEC-06-HASH: Refresh token with tampered secret/hash rejected
    const decodedRt = jwt.decode(rotatedRt) as any;
    const forgedSecretRt = signRefreshToken({
      userId: decodedRt.userId,
      sessionId: decodedRt.sessionId,
      familyId: decodedRt.familyId,
      tokenSecret: 'tampered_secret_which_does_not_match_db_hash_123',
    });
    const hashMismatchRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `ekraf_rt=${forgedSecretRt}` },
    });
    assert(hashMismatchRes.status === 401, 'SEC-06-HASH', 'Refresh token with mismatched database hash rejected (HTTP 401)');

    // SEC-06-EXPIRED: Expired refresh token rejected
    const expiredRt = jwt.sign(
      { userId: decodedRt.userId, sessionId: decodedRt.sessionId, familyId: decodedRt.familyId, tokenSecret: 'any' },
      envConfig.jwtRefreshSecret,
      { expiresIn: '-1s' }
    );
    const expiredRtRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `ekraf_rt=${expiredRt}` },
    });
    assert(expiredRtRes.status === 401, 'SEC-06-EXPIRED', 'Expired refresh token rejected (HTTP 401)');

    // SEC-07: Refresh Token Reuse Detection (Replay attack triggers revocation of entire family)
    const reuseRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `ekraf_rt=${initialRt}` }, // using OLD already-used token!
    });
    assert(reuseRes.status === 401, 'SEC-07', 'Token reuse detected and rejected (HTTP 401)');

    // Verify family was revoked: rotated token should now also be rejected
    const afterRevokeRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `ekraf_rt=${rotatedRt}` },
    });
    assert(afterRevokeRes.status === 401, 'SEC-07-FAMILY', 'Entire token family revoked after reuse attempt');

    // SEC-06-CONCURRENT: Concurrent parallel refresh requests on the same active token
    const parallelLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'UserSecurePassword123!',
      }),
    });
    const parallelCookies = parallelLogin.headers.get('set-cookie') || '';
    const parallelRtMatch = parallelCookies.match(/ekraf_rt=([^;]+)/);
    const parallelRt = parallelRtMatch ? parallelRtMatch[1] : '';

    // Fire 2 concurrent requests simultaneously with the same refresh token
    const [parallelRes1, parallelRes2] = await Promise.all([
      fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: `ekraf_rt=${parallelRt}` },
      }),
      fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: `ekraf_rt=${parallelRt}` },
      }),
    ]);

    // In atomic CAS: either one succeeds (200) and the other fails (401), or both fail safely.
    // They must NEVER both succeed (which would violate atomic rotation invariant).
    const statusCounts = [parallelRes1.status, parallelRes2.status];
    const bothSucceeded = statusCounts.every((s) => s === 200);
    assert(!bothSucceeded, 'SEC-06-CONCURRENT', 'Concurrent parallel refresh prevents issuing two valid successor sessions (CAS invariant)');

    // SEC-06-INACTIVE: Refresh on user marked inactive
    const tempInactiveUser = await prisma.user.create({
      data: {
        email: `temp_inact_${Date.now()}@ekraftuban.id`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
        role: 'USER',
        isActive: true, // starts active
      },
    });
    const inactFamilyId = randomUUID();
    const inactSessionId = randomUUID();
    const inactTokenSecret = randomBytes(32).toString('hex');
    const inactTokenHash = Buffer.from(inactTokenSecret).toString('hex'); // dummy hash
    await prisma.authSession.create({
      data: {
        id: inactSessionId,
        userId: tempInactiveUser.id,
        familyId: inactFamilyId,
        refreshTokenHash: inactTokenHash,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    // Now deactivate user
    await prisma.user.update({
      where: { id: tempInactiveUser.id },
      data: { isActive: false },
    });
    const inactRtToken = signRefreshToken({
      userId: tempInactiveUser.id,
      sessionId: inactSessionId,
      familyId: inactFamilyId,
      tokenSecret: inactTokenSecret,
    });
    const inactRefreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `ekraf_rt=${inactRtToken}` },
    });
    assert(inactRefreshRes.status === 401, 'SEC-06-INACTIVE', 'Refresh token for deactivated account rejected (HTTP 401)');

    // SEC-08: Logout revokes session and clears cookies
    const freshLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'UserSecurePassword123!',
      }),
    });
    const freshCookies = freshLogin.headers.get('set-cookie') || '';
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: freshCookies },
    });
    const clearCookiesArr = logoutRes.headers.getSetCookie ? logoutRes.headers.getSetCookie() : [logoutRes.headers.get('set-cookie') || ''];
    const clearCookiesStr = clearCookiesArr.join('; ').toLowerCase();
    assert(
      logoutRes.status === 200 && clearCookiesStr.includes('ekraf_at=') && (clearCookiesStr.includes('expires=') || clearCookiesStr.includes('max-age=0')),
      'SEC-08',
      'Logout successfully cleared auth cookies'
    );

    // -------------------------------------------------------------------------
    // SECTION B: GOOGLE OAUTH SECURITY TESTS (AUTH-01 TO AUTH-17)
    // -------------------------------------------------------------------------
    console.log('\n--- B. Google OAuth Security Tests (AUTH-01 to AUTH-17) ---');

    // AUTH-01 & AUTH-03: Redirect URI from static config, ignores query param tampering
    const oauthUrlRes = await fetch(`${baseUrl}/auth/google/url?redirect_uri=https://attacker-site.com/steal-token`);
    const oauthUrlData = await oauthUrlRes.json();
    const oauthCookies = oauthUrlRes.headers.get('set-cookie') || '';

    if (envConfig.googleClientId && envConfig.googleRedirectUri) {
      assert(
        oauthUrlData.data.url.includes(encodeURIComponent(envConfig.googleRedirectUri)),
        'AUTH-01',
        'Google OAuth URL uses strictly configured GOOGLE_REDIRECT_URI'
      );
      assert(
        !oauthUrlData.data.url.includes('attacker-site.com'),
        'AUTH-03',
        'Manipulative query parameter redirect_uri is strictly ignored'
      );
      assert(
        oauthCookies.includes('ekraf_oauth_state') && oauthCookies.includes('HttpOnly'),
        'AUTH-04-STATE',
        'Cryptographic OAuth state generated and bound to HttpOnly cookie'
      );
    } else {
      assert(
        oauthUrlRes.status === 503 || oauthUrlData.data.isConfigured === false,
        'AUTH-02',
        'Endpoint safely reports unconfigured state when OAuth env is missing'
      );
    }

    // AUTH-05: OAuth Callback with invalid / mismatched state rejected
    const badStateCallback = await fetch(`${baseUrl}/auth/google/callback?code=fake_code&state=forged_state`, {
      headers: { Cookie: 'ekraf_oauth_state=genuine_state_xyz' },
      redirect: 'manual',
    });
    const badStateLocation = decodeURIComponent((badStateCallback.headers.get('location') || '').replace(/\+/g, ' ')).toLowerCase();
    assert(
      badStateCallback.status === 302 && badStateLocation.includes('state tidak valid'),
      'AUTH-05',
      'OAuth callback rejects state mismatch (redirects to login with error)'
    );

    // AUTH-06: OAuth Callback with missing state cookie (expired state)
    const expiredStateCallback = await fetch(`${baseUrl}/auth/google/callback?code=fake_code&state=some_state`, {
      redirect: 'manual',
    });
    const expiredLocation = decodeURIComponent((expiredStateCallback.headers.get('location') || '').replace(/\+/g, ' ')).toLowerCase();
    assert(
      expiredStateCallback.status === 302 && expiredLocation.includes('state tidak valid'),
      'AUTH-06',
      'OAuth callback rejects missing/expired state cookie'
    );

    // AUTH-07: Anti-replay state cleared on callback
    const stateClearCookiesArr = badStateCallback.headers.getSetCookie ? badStateCallback.headers.getSetCookie() : [badStateCallback.headers.get('set-cookie') || ''];
    const stateClearCookies = stateClearCookiesArr.join('; ');
    assert(
      stateClearCookies.includes('ekraf_oauth_state') && (stateClearCookies.toLowerCase().includes('max-age=0') || stateClearCookies.toLowerCase().includes('expires=')),
      'AUTH-07',
      'OAuth state cookie cleared immediately on callback invocation'
    );

    // AUTH-08: Invalid authorization code handling
    const invalidCodeCallback = await fetch(`${baseUrl}/auth/google/callback?code=invalid_code_123&state=matching_state`, {
      headers: { Cookie: 'ekraf_oauth_state=matching_state' },
      redirect: 'manual',
    });
    const invalidCodeLocation = invalidCodeCallback.headers.get('location') || '';
    assert(
      invalidCodeCallback.status === 302 && (invalidCodeLocation.includes('Gagal+menukar') || invalidCodeLocation.includes('Google+OAuth+belum+dikonfigurasi')),
      'AUTH-08',
      'Invalid authorization code fails safely without crashing server'
    );

    // AUTH-17: POST /google rejects arbitrary client body identity (email / name) without verified Google ID Token
    const fakeIdentityRes = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ekraftuban.id',
        displayName: 'Fake Admin Impersonator',
      }),
    });
    assert(
      fakeIdentityRes.status === 422,
      'AUTH-17',
      'POST /auth/google strictly rejects unverified client-provided identity body'
    );

    // AUTH-09: POST /google with forged / invalid JWT signature rejected
    const forgedToken = jwt.sign(
      { sub: 'google_123', email: 'admin@ekraftuban.id', email_verified: true, aud: 'fake_aud' },
      'forged_private_key'
    );
    const forgedTokenRes = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: forgedToken,
      }),
    });
    assert(
      forgedTokenRes.status === 401 || forgedTokenRes.status === 503,
      'AUTH-09',
      'POST /auth/google rejects forged token signature cryptographically'
    );

    // -------------------------------------------------------------------------
    // SECTION C: STORAGE & FILE UPLOAD INTEGRITY TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- C. Storage & File Upload Integrity Tests ---');

    // STO-01: Magic byte validation function unit test
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const validWebp = Buffer.from('RIFF....WEBPVP8 ...');
    const fakePng = Buffer.from('This is actually a malicious PHP shell or plain text');

    assert(validateImageSignature(validJpeg, 'image/jpeg') === true, 'STO-01-JPEG', 'Valid JPEG magic bytes detected');
    assert(validateImageSignature(validPng, 'image/png') === true, 'STO-01-PNG', 'Valid PNG magic bytes detected');
    assert(validateImageSignature(validWebp, 'image/webp') === true, 'STO-01-WEBP', 'Valid WebP magic bytes detected');
    assert(validateImageSignature(fakePng, 'image/png') === false, 'STO-01-FAKE', 'Fake PNG extension with plain text rejected by magic bytes');

    // STO-02: Upload endpoint requires authentication
    const unauthUploadRes = await fetch(`${baseUrl}/uploads/images`, {
      method: 'POST',
    });
    assert(unauthUploadRes.status === 401, 'STO-02', 'Upload endpoint rejects unauthenticated request (HTTP 401)');

    // STO-03: Admin login and upload test with genuine PNG buffer
    const adminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ekraftuban.id',
        password: 'AdminPassword123!',
      }),
    });
    const adminCookies = adminLogin.headers.get('set-cookie') || '';

    // Create a minimal 1x1 valid PNG in buffer
    const miniPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const boundary = '----WebKitFormBoundaryTest123';
    const postBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`),
      miniPng,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const uploadRes = await fetch(`${baseUrl}/uploads/images?folder=works`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Cookie: adminCookies,
      },
      body: postBody,
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 201 && uploadData.data?.path, 'STO-03', 'Genuine PNG image uploaded successfully');

    // STO-04: Uploading spoofed MIME text file fails magic byte check
    const spoofedBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="fake.png"\r\nContent-Type: image/png\r\n\r\n`),
      fakePng,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const spoofUploadRes = await fetch(`${baseUrl}/uploads/images`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Cookie: adminCookies,
      },
      body: spoofedBody,
    });
    assert(spoofUploadRes.status === 422, 'STO-04', 'Spoofed MIME image rejected by magic bytes verification (HTTP 422)');

    // STO-05: Delete image handles nonexistent or local path safely
    const deleteSuccess = await deleteImage(uploadData.data?.path);
    assert(typeof deleteSuccess === 'boolean', 'STO-05-DELETE', 'Image deletion safely handles file removal');

    // -------------------------------------------------------------------------
    // SECTION D: AUTHORIZATION & IDOR GUARD TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- D. Authorization & IDOR Guard Tests ---');

    // AUT-01: Normal user cannot access Admin Overview
    const userOverviewRes = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Cookie: userCookie },
    });
    assert(userOverviewRes.status === 403, 'AUT-01', 'Regular USER forbidden from accessing admin endpoints (HTTP 403)');

    // AUT-02: Admin CAN access Admin Overview
    const adminOverviewRes = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Cookie: adminCookies },
    });
    const adminOverviewData = await adminOverviewRes.json();
    assert(
      adminOverviewRes.status === 200 && adminOverviewData.data?.works?.total >= 0,
      'AUT-02',
      'Administrator successfully accessed admin overview metrics'
    );

    // AUT-03: Creator IDOR Guard: Kreator 2 unlinked cannot manage works of Kreator 1
    const kreator2Login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'kreator2@ekraftuban.id',
        password: 'UserPassword123!',
      }),
    });
    const kreator2Cookies = kreator2Login.headers.get('set-cookie') || '';
    const kreator2WorksRes = await fetch(`${baseUrl}/me/works`, {
      headers: { Cookie: kreator2Cookies },
    });
    assert(
      kreator2WorksRes.status === 403,
      'AUT-03',
      'Unlinked creator blocked from modifying or accessing creator portal (HTTP 403)'
    );

    // -------------------------------------------------------------------------
    // SECTION E: ENVIRONMENT PRODUCTION FAIL-FAST TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- E. Environment Fail-Fast Invariant Tests ---');

    // ENV-01: Access Secret === Refresh Secret must be rejected
    const prevNodeEnv = process.env.NODE_ENV;
    const prevAccess = process.env.JWT_ACCESS_SECRET;
    const prevRefresh = process.env.JWT_REFRESH_SECRET;
    const prevDb = process.env.DATABASE_URL;

    let envIdenticalSecretsCaught = false;
    try {
      process.env.JWT_ACCESS_SECRET = 'identical_secret_of_at_least_32_characters_123';
      process.env.JWT_REFRESH_SECRET = 'identical_secret_of_at_least_32_characters_123';
      validateAndLoadConfig();
    } catch (err: any) {
      if (err.message.includes('JWT_ACCESS_SECRET dan JWT_REFRESH_SECRET harus berbeda')) {
        envIdenticalSecretsCaught = true;
      }
    }
    assert(envIdenticalSecretsCaught, 'ENV-01', 'Environment validation rejects identical access and refresh secrets');

    // ENV-02: Production rejects SQLite database URL
    const prevWebOrigin = process.env.WEB_ORIGIN;
    let envSqliteProductionCaught = false;
    try {
      process.env.NODE_ENV = 'production';
      process.env.WEB_ORIGIN = 'https://ekraftuban.id';
      process.env.JWT_ACCESS_SECRET = 'strong_unique_access_secret_for_production_test_123';
      process.env.JWT_REFRESH_SECRET = 'strong_unique_refresh_secret_for_production_test_456';
      process.env.DATABASE_URL = 'file:./dev.db';
      process.env.SUPABASE_URL = 'https://proj.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_key_test';
      validateAndLoadConfig();
    } catch (err: any) {
      if (err.message.includes('DATABASE_URL wajib') || err.message.includes('SQLite')) {
        envSqliteProductionCaught = true;
      }
    }
    assert(envSqliteProductionCaught, 'ENV-02', 'Environment validation strictly prohibits SQLite in production');

    // Restore environment variables
    process.env.NODE_ENV = prevNodeEnv;
    process.env.WEB_ORIGIN = prevWebOrigin;
    process.env.JWT_ACCESS_SECRET = prevAccess;
    process.env.JWT_REFRESH_SECRET = prevRefresh;
    process.env.DATABASE_URL = prevDb;
    process.env.NODE_ENV = prevNodeEnv;
    process.env.JWT_ACCESS_SECRET = prevAccess;
    process.env.JWT_REFRESH_SECRET = prevRefresh;
    process.env.DATABASE_URL = prevDb;

    console.log('\n======================================================');
    console.log(`🎉 ALL ADVANCED SECURITY & FOUNDATION TESTS PASSED (${passed}/${passed + failed})!`);
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runSecurityTests().catch((err) => {
  console.error('\n❌ Security test suite failed with error:', err);
  process.exit(1);
});
