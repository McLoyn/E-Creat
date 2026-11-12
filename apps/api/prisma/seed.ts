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

  // 3. Seed Categories (SUBSECTOR & SUBAPP_TYPE)
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
