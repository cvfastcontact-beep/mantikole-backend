import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    })
  : null;

// In-Memory Fallback Data Store for seamless local operation without local Postgres
export const memoryStore = {
  users: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'admin',
      email: 'admin@desamantikole.id',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
      full_name: 'Perangkat Desa Mantikole',
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  ],
  articles: [
    {
      id: '22222222-2222-2222-2222-222222222221',
      title: 'Pengembangan Destinasi Wisata Pemandian Air Panas Mantikole Berbasis Ekowisata',
      slug: 'pengembangan-destinasi-wisata-pemandian-air-panas-mantikole',
      content: `Pemerintah Desa Mantikole bersama Tim KKN menginisiasi program revitalisasi fasilitas Pemandian Air Panas Alami Mantikole. Program ini mencakup penataan area sanitasi, penyediaan fasilitas informasi digital berbasis QR code, serta peningkatan aksesibilitas bagi pengunjung.\n\nPemandian air panas ini memiliki kandungan belerang alami dari sumber air pegunungan yang sangat berkhasiat untuk relaksasi otot dan kesehatan kulit. MelaluiSentuhan inovasi digital, wisatawan kini dapat mengakses peta digital dan reservasi tiket secara efisien.`,
      summary: 'Pemerintah Desa Mantikole bersama Tim KKN merevitalisasi fasilitas Pemandian Air Panas Alami berbasis ekowisata dan integrasi informasi digital.',
      category: 'Pembangunan',
      featured_image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      author_id: '00000000-0000-0000-0000-000000000001',
      author_name: 'Perangkat Desa Mantikole',
      is_published: true,
      views_count: 142,
      created_at: '2026-08-01T09:00:00.000Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Peluncuran Portal Pelayanan Administrasi Digital Warga Mantikole',
      slug: 'peluncuran-portal-pelayanan-administrasi-digital-warga-mantikole',
      content: `Untuk mempermudah kepengurusan surat keterangan usaha (SKU), surat domisili (SKD), dan surat keterangan tidak mampu (SKTM), Desa Mantikole kini meluncurkan portal layanan surat mandiri secara online.\n\nWarga cukup memasukkan NIK dan identitas tanpa perlu membuat akun, mengunduh berkas template resmi, dan menerima Nomor Tiket Resi unik (contoh: MNT-2026-08001) untuk memantau proses verifikasi dari perangkat desa.`,
      summary: 'Desa Mantikole merilis portal pengajuan surat mandiri berbasis nomor resi unik tanpa perlu mengantre lama di kantor desa.',
      category: 'Pengumuman',
      featured_image_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
      author_id: '00000000-0000-0000-0000-000000000001',
      author_name: 'Sekretariat Desa Mantikole',
      is_published: true,
      views_count: 98,
      created_at: '2026-08-03T10:30:00.000Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222223',
      title: 'Program Pendampingan Petani Kakao Mantikole Peningkatan Mutu Biji Kering',
      slug: 'program-pendampingan-petani-kakao-mantikole',
      content: `Upaya mendorong perekonomian desa dilakukan melalui sosialisasi teknik fermentasi biji kakao modern agar nilai jual di tingkat kelompok tani semakin meningkat. Kakao Mantikole merupakan pilar ekonomi utama warga yang diminati oleh berbagai industri cokelat.`,
      summary: 'Sosialisasi teknik fermentasi biji kakao modern digelar untuk meningkatkan daya saing hasil panen petani kakao Mantikole.',
      category: 'Edukasi',
      featured_image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80',
      author_id: '00000000-0000-0000-0000-000000000001',
      author_name: 'Tim Penyuluh Pertanian',
      is_published: true,
      views_count: 76,
      created_at: '2026-08-05T14:15:00.000Z',
    },
  ],
  village_highlights: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Pemandian Air Panas Alami Mantikole',
      slug: 'pemandian-air-panas-alami-mantikole',
      type: 'wisata',
      short_description: 'Mata air panas alami pegunungan yang kaya kandungan belerang alami, sangat baik untuk kesehatan kulit dan relaksasi tubuh.',
      full_description: 'Pemandian Air Panas Alami Mantikole merupakan salah satu destinasi wisata unggulan di Kabupaten Sigi, Sulawesi Tengah. Terletak di lereng pegunungan yang asri, sumber air panas ini mengandung belerang alami yang dipercaya berkhasiat terapi kesehatan kulit, melancarkan sirkulasi darah, dan melepas penat.',
      location_details: 'Kecamatan Dolo Barat, Kabupaten Sigi, Sulawesi Tengah',
      latitude: -1.0745,
      longitude: 119.8322,
      price_info: 'Rp 5.000 / Orang',
      gallery_urls: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80'
      ],
      created_at: '2026-08-01T08:00:00.000Z',
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      title: 'Wisata Air Terjun Mantikole',
      slug: 'wisata-air-terjun-mantikole',
      type: 'wisata',
      short_description: 'Air terjun alami dengan gemericik air jernih dan udara pegunungan yang sejuk di tengah rindangnya pepohonan.',
      full_description: 'Wisata Air Terjun Mantikole menawarkan pesona keindahan alam Sulawesi Tengah yang masih sangat alami. Dengan jalur trekking yang mudah dijangkau dan panorama hutan pegunungan yang hijau, tempat ini menjadi lokasi favorit warga dan wisatawan untuk rekreasi.',
      location_details: 'Kecamatan Dolo Barat, Kabupaten Sigi, Sulawesi Tengah',
      latitude: -1.0782,
      longitude: 119.8351,
      price_info: 'Gratis / Donasi Kebersihan',
      gallery_urls: [
        'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
      ],
      created_at: '2026-08-01T08:30:00.000Z',
    },
    {
      id: '11111111-1111-1111-1111-111111111113',
      title: 'Perkebunan Kakao (Cokelat) Superior',
      slug: 'perkebunan-kakao-superior',
      type: 'komoditas',
      short_description: 'Komoditas utama Desa Mantikole dengan cita rasa biji kakao fermentasi bermutu tinggi.',
      full_description: 'Kakao merupakan komoditas perkebunan utama warga Desa Mantikole. Didukung oleh struktur tanah pegunungan yang subur di Dolo Barat, kakao Mantikole menghasilkan biji cokelat berkualitas tinggi yang dipasok ke berbagai industri olahan makanan.',
      location_details: 'Desa Mantikole, Dolo Barat, Sigi',
      latitude: -1.0720,
      longitude: 119.8290,
      price_info: 'Rp 35.000 / Kg (Biji Kering)',
      gallery_urls: [
        'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80'
      ],
      created_at: '2026-08-01T09:00:00.000Z',
    },
    {
      id: '11111111-1111-1111-1111-111111111114',
      title: 'Hasil Perkebunan Cengkeh & Kelapa',
      slug: 'hasil-perkebunan-cengkeh-kelapa',
      type: 'komoditas',
      short_description: 'Komoditas rempah unggulan cengkeh aromatik dan produk kelapa rakyat berdaya saing tinggi.',
      full_description: 'Selain kakao, pertanian Desa Mantikole ditopang oleh komoditas cengkeh dan kelapa. Cengkeh Mantikole terkenal memiliki aroma khas dan kadar minyak atsiri yang memuaskan pembeli skala besar.',
      location_details: 'Desa Mantikole, Dolo Barat, Sigi',
      latitude: -1.0710,
      longitude: 119.8280,
      price_info: 'Variatif sesuai harga pasar',
      gallery_urls: [
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80'
      ],
      created_at: '2026-08-01T09:30:00.000Z',
    },
  ],
  letter_templates: [
    {
      id: '33333333-3333-3333-3333-333333333331',
      title: 'Surat Keterangan Usaha (SKU)',
      code: 'SKU',
      description: 'Surat keterangan resmi dari desa untuk keperluan pembukaan rekening usaha, pengajuan KUR/Kredit perbankan, atau verifikasi izin usaha.',
      file_url: '/templates/template-sku-mantikole.docx',
      requirements: ['Kartu Tanda Penduduk (KTP) Pemohon', 'Kartu Keluarga (KK) Pemohon', 'Foto Bukti Kegiatan Usaha'],
      created_at: '2026-08-01T10:00:00.000Z',
    },
    {
      id: '33333333-3333-3333-3333-333333333332',
      title: 'Surat Keterangan Domisili (SKD)',
      code: 'SKD',
      description: 'Surat keterangan domisili tempat tinggal warga atau badan usaha di wilayah Desa Mantikole.',
      file_url: '/templates/template-skd-mantikole.docx',
      requirements: ['Kartu Tanda Penduduk (KTP) Pemohon', 'Kartu Keluarga (KK) Pemohon', 'Surat Pengantar RT/RW'],
      created_at: '2026-08-01T10:00:00.000Z',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      title: 'Surat Keterangan Tidak Mampu (SKTM)',
      code: 'SKTM',
      description: 'Surat keterangan tidak mampu untuk persyaratan beasiswa pendidikan, keringanan biaya rumah sakit, atau bantuan sosial.',
      file_url: '/templates/template-sktm-mantikole.docx',
      requirements: ['Kartu Tanda Penduduk (KTP) Pemohon', 'Kartu Keluarga (KK) Pemohon', 'Surat Pengantar RT/RW', 'Foto Kondisi Rumah'],
      created_at: '2026-08-01T10:00:00.000Z',
    },
  ],
  letter_requests: [
    {
      id: '44444444-4444-4444-4444-444444444441',
      ticket_number: 'MNT-2026-08001',
      applicant_nik: '7201021508920001',
      applicant_name: 'Budi Santoso',
      applicant_phone: '081234567890',
      applicant_address: 'Dusun II Mantikole, RT 03/RW 01',
      letter_type_code: 'SKU',
      attachment_urls: ['/uploads/ktp_budi.jpg', '/uploads/usaha_budi.jpg'],
      status: 'PENDING',
      admin_notes: 'Sedang diverifikasi oleh Perangkat Desa',
      created_at: '2026-08-06T10:00:00.000Z',
      updated_at: '2026-08-06T10:00:00.000Z',
    },
    {
      id: '44444444-4444-4444-4444-444444444442',
      ticket_number: 'MNT-2026-08002',
      applicant_nik: '7201022004950002',
      applicant_name: 'Siti Rahma',
      applicant_phone: '085299887766',
      applicant_address: 'Dusun I Mantikole, RT 01/RW 01',
      letter_type_code: 'SKTM',
      attachment_urls: ['/uploads/ktp_siti.jpg'],
      status: 'COMPLETED',
      admin_notes: 'Surat telah selesai diverifikasi dan dapat diambil di Kantor Desa atau diunduh.',
      created_at: '2026-08-05T11:20:00.000Z',
      updated_at: '2026-08-05T14:00:00.000Z',
    },
  ],
  ai_knowledge_base: [
    {
      id: '55555555-5555-5555-5555-555555555551',
      category: 'Wisata',
      title: 'Pemandian Air Panas Alami Mantikole',
      content: 'Pemandian Air Panas Mantikole berlokasi di Kecamatan Dolo Barat, Kabupaten Sigi, Sulawesi Tengah. Tiket masuk senilai Rp 5.000 per orang. Mengandung belerang alami yang sangat bermanfaat bagi relaksasi dan kesehatan kulit.',
      is_active: true,
    },
    {
      id: '55555555-5555-5555-5555-555555555552',
      category: 'Wisata',
      title: 'Wisata Air Terjun Mantikole',
      content: 'Wisata Air Terjun Mantikole menawarkan kesejukan pegunungan Sigi dengan akses trekking alami. Buka setiap hari, bebas biaya masuk (donasi kebersihan seikhlasnya).',
      is_active: true,
    },
    {
      id: '55555555-5555-5555-5555-555555555553',
      category: 'Layanan',
      title: 'Jam Pelayanan Kantor Desa',
      content: 'Kantor Desa Mantikole melayani masyarakat pada hari Senin hingga Jumat, pukul 08:00 - 15:00 WITA. Pengajuan surat mandiri juga dapat diakses 24 jam melalui website resmi.',
      is_active: true,
    },
    {
      id: '55555555-5555-5555-5555-555555555554',
      category: 'Layanan',
      title: 'Persyaratan Surat Keterangan Usaha (SKU)',
      content: 'Untuk mengajukan SKU warga wajib menyiapkan foto KTP, KK, dan foto tempat usaha. Proses verifikasi admin memerlukan 1-2 hari kerja dan dapat dilacak via nomor resi MNT-2026-XXXXX.',
      is_active: true,
    },
  ]
};
