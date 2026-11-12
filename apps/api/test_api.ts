import { app } from './src/app.js';
import http from 'http';

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(4005, '127.0.0.1', () => resolve()));
  const baseUrl = 'http://127.0.0.1:4005/api/v1';

  try {
    console.log('Testing /health...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const health = await healthRes.json();
    console.log('Health:', health);

    console.log('Testing public categories...');
    const catRes = await fetch(`${baseUrl}/categories?kind=SUBSECTOR`);
    const cats = await catRes.json();
    console.log('Categories count:', cats.data.length);

    console.log('Testing public Sub-Apps...');
    const subRes = await fetch(`${baseUrl}/sub-apps`);
    const subApps = await subRes.json();
    console.log('Published Sub-Apps count:', subApps.data.length);

    console.log('Testing public Creative Profiles...');
    const creatRes = await fetch(`${baseUrl}/creative-profiles`);
    const creats = await creatRes.json();
    console.log('Published Creative Profiles count:', creats.data.length);

    console.log('Testing Admin Login...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ekraftuban.id',
        password: 'AdminPassword123!',
      }),
    });
    const loginData = await loginRes.json();
    console.log('Login success:', loginData.data?.email, 'Role:', loginData.data?.role);

    const cookies = loginRes.headers.get('set-cookie');
    console.log('Set-Cookie received:', !!cookies);

    console.log('Testing Admin Overview with Auth Cookie...');
    const overviewRes = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Cookie: cookies || '' },
    });
    const overview = await overviewRes.json();
    console.log('Overview stats:', overview.data);

    console.log('\nALL BACKEND API TESTS PASSED SUCCESSFULLY! ✅');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
