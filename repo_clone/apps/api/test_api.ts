import { app } from './src/app.js';
import http from 'http';

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(4006, '127.0.0.1', () => resolve()));
  const baseUrl = 'http://127.0.0.1:4006/api/v1';

  try {
    console.log('--- 1. Health & Baseline Tests ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const health = await healthRes.json();
    console.log('Health:', health.status);

    console.log('--- 2. Public Showcase & Pasar Tests ---');
    const worksRes = await fetch(`${baseUrl}/works`);
    const works = await worksRes.json();
    console.log('Public Works Count (must be 3 published):', works.data.length);
    if (works.data.length !== 3) {
      throw new Error(`Expected 3 published works, got ${works.data.length}`);
    }

    const workSlugRes = await fetch(`${baseUrl}/works/kain-gedhog-motif-ganggang-sari`);
    const workDetail = await workSlugRes.json();
    console.log('Work detail title:', workDetail.data.title);
    console.log('Work creator contact whatsappUrl:', workDetail.data.creator?.contact?.whatsappUrl);
    if (!workDetail.data.creator?.contact?.whatsappUrl?.startsWith('https://wa.me/6281234567801')) {
      throw new Error(`Invalid WhatsApp contact URL on work detail`);
    }

    const productsRes = await fetch(`${baseUrl}/products`);
    const products = await productsRes.json();
    console.log('Public Products Count (must be 3 published):', products.data.length);
    if (products.data.length !== 3) {
      throw new Error(`Expected 3 published products, got ${products.data.length}`);
    }

    const prodSlugRes = await fetch(`${baseUrl}/products/kain-tenun-gedhog-tulis-asli-kerek-motif-kijing-miring`);
    const prodDetail = await prodSlugRes.json();
    console.log('Product detail title:', prodDetail.data.title);
    console.log('Product contact WhatsApp URL:', prodDetail.data.creator?.contact?.whatsappUrl);
    if (!prodDetail.data.creator?.contact?.whatsappUrl?.includes('wa.me/6281234567801')) {
      throw new Error(`Invalid WhatsApp contact URL on product detail`);
    }

    console.log('--- 3. Creator Profile Tab Endpoints ---');
    const cpWorksRes = await fetch(`${baseUrl}/creative-profiles/tenun-gedog-sekar-wangi/works`);
    const cpWorks = await cpWorksRes.json();
    console.log('Profile works count:', cpWorks.data.length);

    const cpProdsRes = await fetch(`${baseUrl}/creative-profiles/tenun-gedog-sekar-wangi/products`);
    const cpProds = await cpProdsRes.json();
    console.log('Profile products count:', cpProds.data.length);

    console.log('--- 4. Creator Auth & CRUD Lifecycle Tests (kreator1) ---');
    const creator1Login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'kreator1@ekraftuban.id',
        password: 'UserPassword123!',
      }),
    });
    const creator1Cookies = creator1Login.headers.get('set-cookie') || '';
    const creator1User = await creator1Login.json();
    console.log('Creator1 logged in:', creator1User.data?.email);

    // Get Creator's own works (including drafts and pending)
    const myWorksRes = await fetch(`${baseUrl}/me/works`, {
      headers: { Cookie: creator1Cookies },
    });
    const myWorks = await myWorksRes.json();
    console.log('Creator1 own works total:', myWorks.data.length);

    // Create a new draft work
    const uniqueTitle = `Kain Uji Coba Integrasi ${Date.now()}`;
    const createWorkRes = await fetch(`${baseUrl}/me/works`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: creator1Cookies },
      body: JSON.stringify({
        title: uniqueTitle,
        description: 'Deskripsi pengujian lifecycle karya Showcase secara komprehensif.',
        technique: 'Tenun Uji',
        motif: 'Uji Coba',
        year: 2025,
        images: ['https://example.com/test.jpg'],
      }),
    });
    const newWork = await createWorkRes.json();
    console.log('Created work draft:', newWork.data.title, 'Status:', newWork.data.status);
    if (newWork.data.status !== 'DRAFT') {
      throw new Error(`Expected status DRAFT, got ${newWork.data.status}`);
    }

    // Submit work for review
    const submitWorkRes = await fetch(`${baseUrl}/me/works/${newWork.data.id}/submit`, {
      method: 'POST',
      headers: { Cookie: creator1Cookies },
    });
    const submittedWork = await submitWorkRes.json();
    if (!submitWorkRes.ok) {
      console.error('Submit work error:', submitWorkRes.status, submittedWork);
    }
    console.log('Submitted work status:', submittedWork.data.status);
    if (submittedWork.data.status !== 'PENDING_REVIEW') {
      throw new Error(`Expected PENDING_REVIEW after submit, got ${submittedWork.data.status}`);
    }

    console.log('--- 5. Creator IDOR Guard Test (kreator2 unlinked) ---');
    const creator2Login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'kreator2@ekraftuban.id',
        password: 'UserPassword123!',
      }),
    });
    const creator2Cookies = creator2Login.headers.get('set-cookie') || '';
    const creator2Res = await fetch(`${baseUrl}/me/works`, {
      headers: { Cookie: creator2Cookies },
    });
    console.log('Unlinked creator status code (must be 403):', creator2Res.status);
    if (creator2Res.status !== 403) {
      throw new Error(`Expected 403 for unlinked creator, got ${creator2Res.status}`);
    }

    console.log('--- 6. Admin Moderation & Lifecycle Tests ---');
    const adminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ekraftuban.id',
        password: 'AdminPassword123!',
      }),
    });
    const adminCookies = adminLogin.headers.get('set-cookie') || '';

    // Check moderation queue
    const modRes = await fetch(`${baseUrl}/admin/moderation`, {
      headers: { Cookie: adminCookies },
    });
    const modData = await modRes.json();
    console.log('Admin moderation queue items:', modData.data.length, 'works:', modData.meta.worksCount, 'products:', modData.meta.productsCount);

    // Admin approves the newly submitted work
    const approveWorkRes = await fetch(`${baseUrl}/admin/works/${newWork.data.id}/approve`, {
      method: 'POST',
      headers: { Cookie: adminCookies },
    });
    const approvedWork = await approveWorkRes.json();
    console.log('Admin approved work status:', approvedWork.data.status);
    if (approvedWork.data.status !== 'PUBLISHED') {
      throw new Error(`Expected status PUBLISHED, got ${approvedWork.data.status}`);
    }

    // Creator edits published work -> K-03 invariant: must revert to PENDING_REVIEW!
    const editPublishedRes = await fetch(`${baseUrl}/me/works/${newWork.data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: creator1Cookies },
      body: JSON.stringify({
        title: 'Kain Uji Coba Integrasi (Diperbarui)',
      }),
    });
    const editedWork = await editPublishedRes.json();
    console.log('K-03 Invariant Test: Creator edited published work status:', editedWork.data.status);
    if (editedWork.data.status !== 'PENDING_REVIEW') {
      throw new Error(`Expected K-03 revert to PENDING_REVIEW, got ${editedWork.data.status}`);
    }

    // Admin requests revision with note
    const reqRevRes = await fetch(`${baseUrl}/admin/works/${newWork.data.id}/request-revision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookies },
      body: JSON.stringify({ note: 'Foto karya perlu ditambahkan minimal 1 foto detail tekstur tenun.' }),
    });
    const revWork = await reqRevRes.json();
    console.log('Admin request revision status:', revWork.data.status, 'Review Note:', revWork.data.reviewNote);
    if (revWork.data.status !== 'NEEDS_REVISION') {
      throw new Error(`Expected NEEDS_REVISION, got ${revWork.data.status}`);
    }

    console.log('\n======================================================');
    console.log('🎉 ALL INTEGRATION & REGRESSION TESTS PASSED (100%)!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
