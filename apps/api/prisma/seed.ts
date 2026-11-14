import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Ekraf HUB database...');

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@ekraftuban.id').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPassword123!';
  const userPassword = process.env.SEED_USER_PASSWORD || 'UserPassword123!';

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const userHash = await bcrypt.hash(userPassword, 10);

  // 1. Seed Admin User
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminHash,
        role: 'ADMIN',
        profile: {
          create: {
            displayName: 'Administrator Ekraf Tuban',
            locationText: 'Tuban Creative Center',
            bio: 'Akun administrator resmi pengelolaan data ekosistem Ekraf HUB V0.1.',
          },
        },
      },
    });
    console.log(`Created admin: ${admin.email}`);
  }

  // 2. Seed Users
  const userEmails = ['kreator1@ekraftuban.id', 'kreator2@ekraftuban.id'];
  for (let i = 0; i < userEmails.length; i++) {
    const email = userEmails[i].toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          passwordHash: userHash,
          role: 'USER',
          profile: {
            create: {
              displayName: `Pengguna Komunitas ${i + 1}`,
              locationText: i === 0 ? 'Kec. Semanding, Kab. Tuban' : 'Kec. Tuban, Kab. Tuban',
              bio: `Kreator aktif ekonomi kreatif Tuban (Sampel Akun ${i + 1}).`,
            },
          },
        },
      });
      console.log(`Created user: ${email}`);
    }
  }

  // 3. Seed Categories (SUBSECTOR, SUBAPP_TYPE, WORK_CATEGORY, PRODUCT_TYPE)
  const subsectors = [
    { name: 'Kriya (Kerajinan)', slug: 'kriya', description: 'Kerajinan tangan, batik gedog, ukiran, dan anyaman khas Tuban.' },
    { name: 'Kuliner', slug: 'kuliner', description: 'Olahan makanan tradisional dan modern legendaris Tuban.' },
    { name: 'Fashion & Tekstil', slug: 'fashion', description: 'Busana, tenun tenun gedog, dan aksesoris tekstil kreatif.' },
    { name: 'Desain Komunikasi Visual', slug: 'dkv', description: 'Desain grafis, ilustrasi, branding, dan identitas visual.' },
    { name: 'Seni Musik & Pertunjukan', slug: 'musik-pertunjukan', description: 'Musisi lokal, grup teater, tari tradisional, dan sanggar seni.' },
    { name: 'Fotografi & Videografi', slug: 'fotografi', description: 'Layanan foto produk, dokumentasi budaya, dan karya sinematik.' },
    { name: 'Aplikasi & Pengembang Game', slug: 'aplikasi-game', description: 'Pengembangan perangkat lunak, web, aplikasi mobile, dan game interaktif.' },
    { name: 'Penerbitan & Sastra', slug: 'penerbitan', description: 'Penulisan buku, kurasi naskah lokal, dan media literasi.' },
  ];

  const subappTypes = [
    { name: 'Direktori & Showcase', slug: 'direktori-showcase', description: 'Katalog pameran dan informasi talenta kreatif Tuban.' },
    { name: 'Kolaborasi & Ruang Kreatif', slug: 'kolaborasi-ruang', description: 'Fasilitas dan portal kerja bersama antar komunitas.' },
    { name: 'Pusat Event & Kalender', slug: 'event-kalender', description: 'Jadwal festival, pameran, dan workshop kreatif.' },
    { name: 'Pemberdayaan & Edukasi', slug: 'pemberdayaan-edukasi', description: 'Pelatihan kapasitas, sertifikasi, dan inkubasi talenta.' },
  ];

  const workCategories = [
    { name: 'Batik Tulis Gedhog', slug: 'batik-tulis-gedhog', description: 'Karya seni batik tulis di atas kain tenun kapas gedhog Kerek Tuban.' },
    { name: 'Tenun Tradisional Gedhog', slug: 'tenun-tradisional-gedhog', description: 'Tenunan pusaka dengan teknik alat tenun gedhog khas desa Kerek.' },
    { name: 'Selendang & Pusaka Adat', slug: 'selendang-pusaka-adat', description: 'Wastra ritual adat, selendang upacara, dan kain warisan leluhur.' },
    { name: 'Kriya Kontemporer', slug: 'kriya-kontemporer', description: 'Eksplorasi modern seni kriya dan tekstil berbasis tradisi lokal Tuban.' },
  ];

  const productTypes = [
    { name: 'Kain Panjang', slug: 'kain-panjang', description: 'Kain lembaran tenun dan batik berukuran standar untuk busana atau koleksi.' },
    { name: 'Sarung Tenun Gedhog', slug: 'sarung-tenun-gedhog', description: 'Sarung etnik tradisional tenun tangan untuk upacara adat dan ibadah.' },
    { name: 'Selendang / Scarf', slug: 'selendang-scarf', description: 'Syal dan selendang tenun gedhog modis untuk aksesoris busana.' },
    { name: 'Busana Siap Pakai', slug: 'busana-siap-pakai', description: 'Pakaian jadi seperti kemeja, outer, dan rompi berbahan kain gedhog.' },
    { name: 'Aksesoris & Dekorasi', slug: 'aksesoris-dekorasi', description: 'Tas, bantalan kursi, taplak meja, dan hiasan dinding etnik.' },
  ];

  const categoryMap = new Map<string, string>();

  for (let idx = 0; idx < subsectors.length; idx++) {
    const item = subsectors[idx];
    const cat = await prisma.category.upsert({
      where: { kind_slug: { kind: 'SUBSECTOR', slug: item.slug } },
      update: { name: item.name, description: item.description, sortOrder: idx },
      create: { kind: 'SUBSECTOR', name: item.name, slug: item.slug, description: item.description, sortOrder: idx },
    });
    categoryMap.set(`subsector:${item.slug}`, cat.id);
  }

  for (let idx = 0; idx < subappTypes.length; idx++) {
    const item = subappTypes[idx];
    const cat = await prisma.category.upsert({
      where: { kind_slug: { kind: 'SUBAPP_TYPE', slug: item.slug } },
      update: { name: item.name, description: item.description, sortOrder: idx },
      create: { kind: 'SUBAPP_TYPE', name: item.name, slug: item.slug, description: item.description, sortOrder: idx },
    });
    categoryMap.set(`type:${item.slug}`, cat.id);
  }

  for (let idx = 0; idx < workCategories.length; idx++) {
    const item = workCategories[idx];
    const cat = await prisma.category.upsert({
      where: { kind_slug: { kind: 'WORK_CATEGORY', slug: item.slug } },
      update: { name: item.name, description: item.description, sortOrder: idx },
      create: { kind: 'WORK_CATEGORY', name: item.name, slug: item.slug, description: item.description, sortOrder: idx },
    });
    categoryMap.set(`work:${item.slug}`, cat.id);
  }

  for (let idx = 0; idx < productTypes.length; idx++) {
    const item = productTypes[idx];
    const cat = await prisma.category.upsert({
      where: { kind_slug: { kind: 'PRODUCT_TYPE', slug: item.slug } },
      update: { name: item.name, description: item.description, sortOrder: idx },
      create: { kind: 'PRODUCT_TYPE', name: item.name, slug: item.slug, description: item.description, sortOrder: idx },
    });
    categoryMap.set(`product:${item.slug}`, cat.id);
  }

  // 4. Seed Sub-Apps (5 apps: PUBLISHED, DRAFT, ARCHIVED)
  const sampleSubApps = [
    {
      name: 'Tuban Creative Directory [Sampel]',
      slug: 'tuban-creative-directory',
      tagline: 'Katalog terpadu profil kreator dan brand kreatif se-Kabupaten Tuban.',
      description: 'Platform direktori publik yang menghimpun seluruh profil pelaku usaha mikro, kecil, dan menengah di sektor ekonomi kreatif Tuban dengan filter subsektor dan kontak terverifikasi.',
      externalUrl: 'https://directory.example.com',
      imagePath: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categorySlug: 'direktori-showcase',
    },
    {
      name: 'Batik Gedog Virtual Showcase [Sampel]',
      slug: 'batik-gedog-virtual-showcase',
      tagline: 'Pameran digital warisan budaya wastra tenun dan batik khas Kerek.',
      description: 'Menampilkan arsip motif otentik, narasi filosofis kain gedog, dan menghubungkan perajin lokal dengan pasar nasional.',
      externalUrl: 'https://gedog.example.com',
      imagePath: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categorySlug: 'direktori-showcase',
    },
    {
      name: 'Agenda Budaya & Kreatif Tuban [Sampel]',
      slug: 'agenda-budaya-kreatif-tuban',
      tagline: 'Kalender jadwal workshop seni, pameran kriya, dan festival tahunan.',
      description: 'Sub-aplikasi terpusat untuk memantau agenda kegiatan kreasi anak muda, jadwal pameran, serta workshop keahlian desain di Tuban.',
      externalUrl: 'https://events.example.com',
      imagePath: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categorySlug: 'event-kalender',
    },
    {
      name: 'Inkubator Talenta Ekraf [Sampel]',
      slug: 'inkubator-talenta-ekraf',
      tagline: 'Modul pelatihan sertifikasi dan pembekalan bisnis kreatif lokal.',
      description: 'Program akselerasi digital bagi kreator muda untuk belajar manajemen keuangan, legalitas merek dagang, dan strategi digital marketing.',
      externalUrl: 'https://inkubasi.example.com',
      imagePath: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80',
      status: 'DRAFT',
      categorySlug: 'pemberdayaan-edukasi',
    },
    {
      name: 'Ruang Kolaborasi Komunitas [Sampel]',
      slug: 'ruang-kolaborasi-komunitas',
      tagline: 'Sistem booking fasilitas coworking space dan studio rekam bersama.',
      description: 'Arsip platform lama yang pernah digunakan untuk penjadwalan ruang kumpul komunitas kreatif di Tuban.',
      externalUrl: 'https://ruang.example.com',
      imagePath: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
      status: 'ARCHIVED',
      archivedAt: new Date(),
      categorySlug: 'kolaborasi-ruang',
    },
  ];

  for (const app of sampleSubApps) {
    const catId = categoryMap.get(`type:${app.categorySlug}`);
    const existing = await prisma.subApp.findUnique({ where: { slug: app.slug } });
    if (!existing) {
      await prisma.subApp.create({
        data: {
          name: app.name,
          slug: app.slug,
          tagline: app.tagline,
          description: app.description,
          externalUrl: app.externalUrl,
          imagePath: app.imagePath,
          status: app.status,
          publishedAt: app.publishedAt,
          archivedAt: app.archivedAt,
          createdById: admin.id,
          categories: catId ? { create: [{ categoryId: catId }] } : undefined,
        },
      });
      console.log(`Created SubApp: ${app.name} (${app.status})`);
    }
  }

  // 5. Seed Creative Profiles (10 actors across districts)
  const sampleProfiles = [
    {
      name: 'Tenun Gedog Sekar Wangi [Sampel]',
      slug: 'tenun-gedog-sekar-wangi',
      summary: 'Perajin kain tenun gedog pewarna alam tradisional Kerek Tuban.',
      description: 'Studio tenun pusaka yang melestarikan kapas lokal, pemintalan manual tradisi desa Margorejo, dan motif batik gedog tulis otentik.',
      city: 'Tuban',
      district: 'Kerek',
      imagePath: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80',
      websiteUrl: 'https://sekarwangi.example.com',
      instagramHandle: '@sekarwangi_gedog',
      whatsappNumber: '6281234567801',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      subsectorSlug: 'kriya',
    },
    {
      name: 'Dapur Legen & Siwalan Nusantara [Sampel]',
      slug: 'dapur-legen-siwalan-nusantara',
      summary: 'Inovasi produk pangan berbasis nira siwalan murni dan manisan modern.',
      description: 'Pelaku kuliner khas pesisir Tuban yang mengemas minuman legen steril higienis dan olahan dessert kekinian berbahan buah ental pilihan.',
      city: 'Tuban',
      district: 'Semanding',
      imagePath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      websiteUrl: 'https://legentuban.example.com',
      instagramHandle: '@legen_nusantara',
      whatsappNumber: '6281234567802',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      subsectorSlug: 'kuliner',
    },
    {
      name: 'Studio Ronggolawe Creative [Sampel]',
      slug: 'studio-ronggolawe-creative',
      summary: 'Agensi desain visual, identitas merek, dan packaging UMKM lokal.',
      description: 'Kolektif desainer grafis muda yang mendedikasikan diri untuk meningkatkan daya saing kemasan produk lokal Tuban ke level nasional.',
      city: 'Tuban',
      district: 'Tuban Kota',
      imagePath: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&auto=format&fit=crop&q=80',
      websiteUrl: 'https://ronggolawe.example.com',
      instagramHandle: '@ronggolawe_creative',
      whatsappNumber: '6281234567803',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      subsectorSlug: 'dkv',
    },
    {
      name: 'Kopi Cetok Pesisir [Sampel]',
      slug: 'kopi-cetok-pesisir',
      summary: 'Roastery kopi lokal pesisir dengan sajian cangkir cetok warisan nelayan.',
      description: 'Kedai dan sentra sangrai kopi artisan yang memadukan kultur minum kopi khas nelayan Palang dengan metode brewing modern.',
      city: 'Tuban',
      district: 'Palang',
      imagePath: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
      websiteUrl: 'https://kopicetok.example.com',
      instagramHandle: '@kopicetok_palang',
      whatsappNumber: '6281234567804',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      subsectorSlug: 'kuliner',
    },
    {
      name: 'Sanggar Tari Surya Kencana [Sampel]',
      slug: 'sanggar-tari-surya-kencana',
      summary: 'Pendidikan tari tradisional Tuban, Tari Thak-Thakan, dan seni gamelan.',
      description: 'Sanggar seni aktif melatih generasi muda dalam seni pertunjukan rakyat khas pesisiran dan kolaborasi tari kontemporer.',
      city: 'Tuban',
      district: 'Jenu',
      imagePath: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
      websiteUrl: 'https://suryakencana.example.com',
      instagramHandle: '@suryakencana_art',
      whatsappNumber: '6281234567805',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      subsectorSlug: 'musik-pertunjukan',
    },
    {
      name: 'Lensa Bumi Tuban [Sampel]',
      slug: 'lensa-bumi-tuban',
      summary: 'Jasa fotografi lanskap, arsitektur goa, dan dokumentasi budaya Tuban.',
      description: 'Kolektif fotografer independen yang mendokumentasikan kekayaan alam dan cagar budaya Tuban untuk promosi pariwisata ramah lingkungan.',
      city: 'Tuban',
      district: 'Rengel',
      imagePath: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&auto=format&fit=crop&q=80',
      websiteUrl: 'https://lensabumi.example.com',
      instagramHandle: '@lensabumi_tuban',
      whatsappNumber: '6281234567806',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      subsectorSlug: 'fotografi',
    },
    {
      name: 'Gerabah Karangagung Lestari [Sampel]',
      slug: 'gerabah-karangagung-lestari',
      summary: 'Perajin tembikar tanah liat tradisional dan keramik artistik modern.',
      description: 'Sentra pembuatan guci, pot dekoratif, dan alat dapur tanah liat dengan teknik bakar tradisional khas pesisir Palang.',
      city: 'Tuban',
      district: 'Palang',
      imagePath: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80',
      websiteUrl: 'https://gerabahkarang.example.com',
      instagramHandle: '@gerabah_karangagung',
      whatsappNumber: '6281234567807',
      status: 'DRAFT',
      subsectorSlug: 'kriya',
    },
    {
      name: 'Pena Pesisir Media [Sampel]',
      slug: 'pena-pesisir-media',
      summary: 'Penerbitan independen dan zine sastra kepemudaan Tuban.',
      description: 'Komunitas penulis yang merilis karya sastra, esai budaya, dan riset sejarah lokal dalam format cetak terbatas dan digital.',
      city: 'Tuban',
      district: 'Tambakboyo',
      imagePath: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
      websiteUrl: 'https://penapesisir.example.com',
      instagramHandle: '@penapesisir',
      whatsappNumber: '6281234567808',
      status: 'ARCHIVED',
      archivedAt: new Date(),
      subsectorSlug: 'penerbitan',
    },
  ];

  for (const prof of sampleProfiles) {
    const catId = categoryMap.get(`subsector:${prof.subsectorSlug}`);
    const existing = await prisma.creativeProfile.findUnique({ where: { slug: prof.slug } });
    if (!existing) {
      await prisma.creativeProfile.create({
        data: {
          name: prof.name,
          slug: prof.slug,
          summary: prof.summary,
          description: prof.description,
          city: prof.city,
          district: prof.district,
          imagePath: prof.imagePath,
          websiteUrl: prof.websiteUrl,
          instagramHandle: prof.instagramHandle,
          whatsappNumber: prof.whatsappNumber,
          status: prof.status,
          publishedAt: prof.publishedAt,
          archivedAt: prof.archivedAt,
          createdById: admin.id,
          categories: catId ? { create: [{ categoryId: catId }] } : undefined,
        },
      });
      console.log(`Created CreativeProfile: ${prof.name} (${prof.status})`);
    }
  }

  // 6. Link Creator 1 to Tenun Gedog Sekar Wangi profile (K-01 Owner Assignment)
  const sekarWangiProfile = await prisma.creativeProfile.findUnique({
    where: { slug: 'tenun-gedog-sekar-wangi' },
  });
  const creator1User = await prisma.user.findUnique({
    where: { email: 'kreator1@ekraftuban.id' },
  });

  if (sekarWangiProfile && creator1User) {
    await prisma.creativeProfileOwner.upsert({
      where: { creativeProfileId: sekarWangiProfile.id },
      update: { userId: creator1User.id },
      create: {
        creativeProfileId: sekarWangiProfile.id,
        userId: creator1User.id,
      },
    });
    console.log(`Linked ${creator1User.email} as owner of ${sekarWangiProfile.name}`);
  }

  // 7. Seed Creative Works (Showcase)
  if (sekarWangiProfile) {
    const sampleWorks = [
      {
        slug: 'kain-gedhog-motif-ganggang-sari',
        title: 'Kain Gedhog Motif Ganggang Sari Pewarna Alami',
        description: 'Karya adiluhung batik tulis canting di atas tenunan kapas gedhog Kerek Tuban. Motif Ganggang Sari mencerminkan keselarasan ekosistem pesisir Tuban dengan aliran air tawar yang membawa kesuburan. Proses pengerjaan canting membutuhkan ketelitian selama 2 bulan menggunakan pewarna alami indigofera dan kulit kayu tingi.',
        year: 2024,
        technique: 'Batik Tulis Canting Tangan & Tenun Gedhog Tradisional',
        motif: 'Ganggang Sari',
        imagePaths: JSON.stringify([
          'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&auto=format&fit=crop&q=80',
        ]),
        categorySlug: 'batik-tulis-gedhog',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        slug: 'tenun-gedhog-kuno-rantai-mas-pusaka',
        title: 'Tenun Gedhog Kuno Rantai Mas Pusaka',
        description: 'Karya tenunan pusaka dengan kerapatan tenun ekstra tinggi. Menggunakan teknik pakan dan lusi manual yang diwariskan turun-temurun sejak era Majapahit di Kadipaten Tuban dengan serat kapas lokal organik hasil pemintalan kenthongan tradisional.',
        year: 2023,
        technique: 'Tenun Tradisional Alat Kayu Gedhog Kerek',
        motif: 'Rantai Mas',
        imagePaths: JSON.stringify([
          'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=80',
        ]),
        categorySlug: 'tenun-tradisional-gedhog',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        slug: 'selendang-gedhog-lok-can-pesisir',
        title: 'Selendang Gedhog Motif Lok Can Akulturasi Pesisir',
        description: 'Motif Lok Can merupakan bukti otentik akulturasi budaya Tionghoa dan Jawa pesisir di pelabuhan kuno Tuban, menghadirkan harmoni visual burung phoenix dalam balutan warna bumi alami dari kulit kayu mahoni dan tingi.',
        year: 2024,
        technique: 'Batik Tulis Halus & Tenun Lurik Lembut',
        motif: 'Lok Can',
        imagePaths: JSON.stringify([
          'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
        ]),
        categorySlug: 'selendang-pusaka-adat',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        slug: 'eksplorasi-motif-kijing-miring-kontemporer',
        title: 'Eksplorasi Motif Kijing Miring Kontemporer',
        description: 'Eksperimen silang teknik memadukan motif klasik Kijing Miring dengan komposisi asimetris dan tekstur serat nanas alami yang lebih ringan untuk kebutuhan interior modern.',
        year: 2025,
        technique: 'Batik Tulis Lilin Dingin & Tenun Gedhog Kombinasi',
        motif: 'Kijing Miring',
        imagePaths: JSON.stringify([
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80',
        ]),
        categorySlug: 'batik-tulis-gedhog',
        status: 'PENDING_REVIEW',
        submittedAt: new Date(),
      },
    ];

    for (const w of sampleWorks) {
      const catId = categoryMap.get(`work:${w.categorySlug}`);
      const existing = await prisma.creativeWork.findUnique({ where: { slug: w.slug } });
      if (!existing) {
        await prisma.creativeWork.create({
          data: {
            creativeProfileId: sekarWangiProfile.id,
            slug: w.slug,
            title: w.title,
            description: w.description,
            year: w.year,
            technique: w.technique,
            motif: w.motif,
            imagePaths: w.imagePaths,
            categoryId: catId,
            status: w.status,
            publishedAt: (w as any).publishedAt,
            submittedAt: (w as any).submittedAt,
          },
        });
        console.log(`Created CreativeWork: ${w.title} (${w.status})`);
      }
    }

    // 8. Seed Creative Products (Pasar)
    const sampleProducts = [
      {
        slug: 'kain-tenun-gedhog-tulis-asli-kerek-motif-kijing-miring',
        title: 'Kain Tenun Gedhog Tulis Asli Kerek Motif Kijing Miring',
        description: 'Kain tenun gedhog lembaran asli khas desa Margorejo Kerek Tuban. Menggunakan kapas asli yang dipintal manual dan dibatik canting halus. Sangat anggun untuk bahan busana resmi maupun koleksi wastra nusantara.',
        priceMin: 850000,
        priceMax: 850000,
        priceUnit: 'lembar',
        availability: 'AVAILABLE',
        categorySlug: 'kain-panjang',
        dimensions: '220 x 105 cm',
        material: '100% Benang Kapas Tenun Tangan, Pewarna Alami Indigo & Kulit Kayu',
        imagePaths: JSON.stringify([
          'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&auto=format&fit=crop&q=80',
        ]),
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        slug: 'sarung-tenun-gedhog-pewarna-alami-sogan-tuban',
        title: 'Sarung Tenun Gedhog Pewarna Alami Sogan Tuban',
        description: 'Sarung tenun etnik berkarakter kokoh dengan sentuhan warna alam kayu mahoni dan tingi khas Tuban pesisir. Dibuat terbatas dengan detail tepi rumbai khas.',
        priceMin: 1200000,
        priceMax: 1500000,
        priceUnit: 'pcs',
        availability: 'MADE_TO_ORDER',
        categorySlug: 'sarung-tenun-gedhog',
        dimensions: '210 x 110 cm',
        material: 'Tenun Gedhog Kerek Halus, Pewarna Sogan Organik',
        imagePaths: JSON.stringify([
          'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&auto=format&fit=crop&q=80',
        ]),
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        slug: 'scarf-tenun-gedhog-minimalis-pesisiran',
        title: 'Scarf Tenun Gedhog Minimalis Pesisiran',
        description: 'Syal tenun ringan dengan tekstur khas gedhog yang bernapas dan sejuk dipakai. Cocok sebagai pelengkap busana santai atau cinderamata khas Tuban bernilai tinggi.',
        priceMin: 275000,
        priceMax: 350000,
        priceUnit: 'pcs',
        availability: 'AVAILABLE',
        categorySlug: 'selendang-scarf',
        dimensions: '180 x 45 cm',
        material: 'Benang Katun Pintal Halus Pewarna Ramah Lingkungan',
        imagePaths: JSON.stringify([
          'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
        ]),
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        slug: 'kemeja-tenun-gedhog-pria-custom',
        title: 'Kemeja Tenun Gedhog Pria Custom Lengan Panjang',
        description: 'Kemeja pria eksklusif dari kain tenun gedhog pilihan dipadu furing trikot yang nyaman. Ukuran dan variasi motif disesuaikan dengan permintaan pembeli.',
        priceMin: 950000,
        priceMax: 1150000,
        priceUnit: 'pcs',
        availability: 'MADE_TO_ORDER',
        categorySlug: 'busana-siap-pakai',
        dimensions: 'Custom Size (S, M, L, XL, XXL)',
        material: 'Kain Tenun Gedhog Asli Kerek & Furing Katun Adem',
        imagePaths: JSON.stringify([
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=80',
        ]),
        status: 'PENDING_REVIEW',
        submittedAt: new Date(),
      },
    ];

    for (const p of sampleProducts) {
      const catId = categoryMap.get(`product:${p.categorySlug}`);
      if (!catId) continue;
      const existing = await prisma.creativeProduct.findUnique({ where: { slug: p.slug } });
      if (!existing) {
        await prisma.creativeProduct.create({
          data: {
            creativeProfileId: sekarWangiProfile.id,
            slug: p.slug,
            title: p.title,
            description: p.description,
            priceMin: p.priceMin,
            priceMax: p.priceMax,
            priceUnit: p.priceUnit,
            availability: p.availability,
            productTypeId: catId,
            dimensions: p.dimensions,
            material: p.material,
            imagePaths: p.imagePaths,
            status: p.status,
            publishedAt: (p as any).publishedAt,
            submittedAt: (p as any).submittedAt,
          },
        });
        console.log(`Created CreativeProduct: ${p.title} (${p.status})`);
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
