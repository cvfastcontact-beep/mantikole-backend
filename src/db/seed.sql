-- Seed Data for Website Desa Mantikole

-- 1. SEED DEFAULT ADMIN USER (Password: admin123)
INSERT INTO users (id, username, email, password_hash, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'admin@desamantikole.id',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of admin123
    'Perangkat Desa Mantikole',
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- 2. SEED SITE SETTINGS & DEMOGRAPHICS
INSERT INTO site_settings (key, value)
VALUES 
('hero_title', '"Selamat Datang di Portal Resmi Desa Mantikole"'),
('hero_subtitle', '"Kecamatan Dolo Barat, Kabupaten Sigi, Sulawesi Tengah. Pusat informasi wisata pemandian air panas alami, perkebunan kakao, dan pelayanan surat digital mandiri."'),
('hero_slogan', '"Maju Bersama Menuju Kemandirian Desa Digital"'),
('village_location_text', '"Kecamatan Dolo Barat, Kabupaten Sigi, Sulawesi Tengah. Akses rute menuju pusat pemerintahan desa, destinasi wisata pemandian air panas alami, dan kawasan perkebunan."'),
('maps_embed_url', '"https://maps.google.com/maps?q=-1.0745,119.8322&z=13&output=embed"'),
('maps_direct_url', '"https://www.google.com/maps/search/?api=1&query=-1.0745,119.8322"'),
('contact_phone', '"0812-3456-7890"'),
('contact_email', '"kantor@desamantikole.id"'),
('office_hours', '"Senin - Jumat, 08:00 - 15:00 WITA"'),
('total_population', '2145'),
('total_families', '582'),
('total_area_km2', '"18.45"'),
('total_hamlets', '3'),
('cacao_production_tons', '120'),
('hotsprings_visitors_monthly', '1850')
ON CONFLICT (key) DO NOTHING;

-- 3. SEED VILLAGE STAFF (PERANGKAT DESA)
INSERT INTO village_staff (id, name, role, description, image_url, order_index)
VALUES
('staff-1', 'Drs. H. Moh. Rizal', 'Kepala Desa', 'Pemimpin Pemerintah Desa Mantikole', '/images/perangkat/kepala_desa.png', 1),
('staff-2', 'Ahmad Subagyo, S.Sos', 'Sekretaris Desa', 'Koordinator Administrasi & Keuangan', '/images/perangkat/sekretaris_desa.png', 2),
('staff-3', 'Ir. Hendra Prasetyo', 'Ketua BPD', 'Badan Permusyawaratan Desa', '/images/perangkat/ketua_bpd.png', 3),
('staff-4', 'Siti Rahmawati, S.E', 'Kaur Keuangan', 'Pengelola Anggaran & Keuangan Desa', '/images/perangkat/kaur_keuangan.png', 4),
('staff-5', 'Rahmat Hidayat, S.IP', 'Kasi Pemerintahan', 'Pelayanan Publik & Tataprama Desa', '/images/perangkat/kasi_pemerintahan.png', 5)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED FAQS
INSERT INTO faqs (id, question, answer, category, order_index)
VALUES
('faq-1', 'Berapa tiket masuk Pemandian Air Panas Alami Mantikole?', 'Tiket masuk Pemandian Air Panas Mantikole sebesar Rp 5.000 per orang. Buka setiap hari pukul 07:00 - 18:00 WITA. Air panas alami pegunungan kaya kandungan belerang untuk kesehatan kulit dan terapi kebugaran.', 'Wisata', 1),
('faq-2', 'Bagaimana cara mengajukan surat keterangan mandiri tanpa antre?', 'Warga cukup membuka menu "Layanan Surat" di website ini, memilih jenis surat (SKU/SKD/SKTM), mengisikan NIK 16 digit dan data diri, lalu klik Kirim. Anda akan langsung menerima Nomor Tiket Resi (misal: MNT-2026-08001) untuk melacak verifikasi status oleh perangkat desa.', 'Layanan', 2),
('faq-3', 'Berapa lama proses verifikasi surat oleh perangkat desa?', 'Verifikasi dokumen oleh staf desa membutuhkan waktu 1-2 hari kerja. Setelah status permohonan menjadi "COMPLETED", surat resmi dapat dicetak atau diambil langsung di Kantor Desa Mantikole.', 'Layanan', 3),
('faq-4', 'Apa saja potensi komoditas perkebunan unggulan di Desa Mantikole?', 'Komoditas perkebunan utama warga adalah Kakao (Cokelat) dengan teknik fermentasi modern berkualitas tinggi, Cengkeh aromatik, Kelapa murni, Jagung, dan Padi persawahan.', 'Komoditas', 4),
('faq-5', 'Kapan jam operasional pelayanan Kantor Desa Mantikole?', 'Pelayanan fisik Kantor Desa beroperasi pada hari Senin hingga Jumat, pukul 08:00 - 15:00 WITA. Sedangkan permohonan surat digital dan informasi AI Chatbot aktif 24 jam.', 'Umum', 5)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED VILLAGE HIGHLIGHTS (WISATA & KOMODITAS)
INSERT INTO village_highlights (id, title, slug, type, short_description, full_description, location_details, latitude, longitude, price_info, gallery_urls)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'Pemandian Air Panas Alami Mantikole',
    'pemandian-air-panas-alami-mantikole',
    'wisata',
    'Mata air panas alami pegunungan yang kaya kandungan belerang alami, sangat baik untuk kesehatan kulit dan relaksasi tubuh.',
    'Pemandian Air Panas Alami Mantikole merupakan salah satu destinasi wisata unggulan di Kabupaten Sigi, Sulawesi Tengah. Terletak di lereng pegunungan yang asri, sumber air panas ini mengandung belerang alami yang dipercaya berkhasiat terapi kesehatan kulit, melancarkan sirkulasi darah, dan melepas penat.',
    'Kecamatan Dolo Barat, Kabupaten Sigi, Sulawesi Tengah',
    -1.07450000,
    119.83220000,
    'Rp 5.000 / Orang',
    ARRAY[
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80'
    ]
),
(
    '11111111-1111-1111-1111-111111111112',
    'Wisata Air Terjun Mantikole',
    'wisata-air-terjun-mantikole',
    'wisata',
    'Air terjun alami dengan gemericik air jernih dan udara pegunungan yang sejuk di tengah rindangnya pepohonan.',
    'Wisata Air Terjun Mantikole menawarkan pesona keindahan alam Sulawesi Tengah yang masih sangat alami. Dengan jalur trekking yang mudah dijangkau dan panorama hutan pegunungan yang hijau, tempat ini menjadi lokasi favorit warga dan wisatawan untuk rekreasi bersama keluarga.',
    'Kecamatan Dolo Barat, Kabupaten Sigi, Sulawesi Tengah',
    -1.07820000,
    119.83510000,
    'Gratis / Donasi Kebersihan',
    ARRAY[
        'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
    ]
),
(
    '11111111-1111-1111-1111-111111111113',
    'Perkebunan Kakao (Cokelat) Superior',
    'perkebunan-kakao-superior',
    'komoditas',
    'Komoditas utama Desa Mantikole dengan cita rasa biji kakao fermentasi fermentasi bermutu tinggi.',
    'Kakao merupakan komoditas perkebunan utama warga Desa Mantikole. Didukung oleh struktur tanah pegunungan yang subur di Dolo Barat, kakao Mantikole menghasilkan biji cokelat berkualitas tinggi yang dipasok ke berbagai industri olahan makanan skala regional dan nasional.',
    'Desa Mantikole, Dolo Barat, Sigi',
    -1.07200000,
    119.82900000,
    'Rp 35.000 / Kg (Biji Kering)',
    ARRAY[
        'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80'
    ]
),
(
    '11111111-1111-1111-1111-111111111114',
    'Hasil Perkebunan Cengkeh & Kelapa',
    'hasil-perkebunan-cengkeh-kelapa',
    'komoditas',
    'Komoditas rempah unggulan cengkeh aromatik dan produk kelapa rakyat berdaya saing tinggi.',
    'Selain kakao, pertanian Desa Mantikole ditopang oleh komoditas cengkeh dan kelapa. Cengkeh Mantikole terkenal memiliki aroma khas dan kadar minyak atsiri yang memuaskan pembeli skala besar.',
    'Desa Mantikole, Dolo Barat, Sigi',
    -1.07100000,
    119.82800000,
    'Variatif sesuai pasar',
    ARRAY[
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80'
    ]
) ON CONFLICT (slug) DO NOTHING;

-- 6. SEED ARTICLES
INSERT INTO articles (id, title, slug, content, summary, category, featured_image_url, author_id, is_published, views_count)
VALUES
(
    '22222222-2222-2222-2222-222222222221',
    'Pengembangan Destinasi Wisata Pemandian Air Panas Mantikole Berbasis Ekowisata',
    'pengembangan-destinasi-wisata-pemandian-air-panas-mantikole',
    'Pemerintah Desa Mantikole bersama Tim KKN menginisiasi program revitalisasi fasilitas Pemandian Air Panas Alami Mantikole. Program ini mencakup penataan area sanitasi, penyediaan fasilitas informasi digital berbasis QR code, serta peningkatan aksesibilitas bagi pengunjung.',
    'Pemerintah Desa Mantikole bersama Tim KKN merevitalisasi fasilitas Pemandian Air Panas Alami berbasis ekowisata dan integrasi informasi digital.',
    'Pembangunan',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    '00000000-0000-0000-0000-000000000001',
    true,
    142
),
(
    '22222222-2222-2222-2222-222222222222',
    'Peluncuran Portal Pelayanan Administrasi Digital Warga Mantikole',
    'peluncuran-portal-pelayanan-administrasi-digital-warga-mantikole',
    'Untuk mempermudah kepengurusan surat keterangan usaha, domisili, dan surat keterangan tidak mampu, Desa Mantikole kini meluncurkan portal layanan surat mandiri secara online. Warga cukup mengunggah identitas dan melacak pengajuan melalui nomor tiket resi unik.',
    'Desa Mantikole merilis portal pengajuan surat mandiri berbasis nomor resi unik tanpa perlu mengantre lama di kantor desa.',
    'Pengumuman',
    'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
    '00000000-0000-0000-0000-000000000001',
    true,
    98
),
(
    '22222222-2222-2222-2222-222222222223',
    'Program Pendampingan Petani Kakao Mantikole Peningkatan Mutu Biji Kering',
    'program-pendampingan-petani-kakao-mantikole',
    'Upaya mendorong perekonomian desa dilakukan melalui sosialisasi teknik fermentasi biji kakao modern agar nilai jual di tingkat kelompok tani semakin meningkat.',
    'Sosialisasi teknik fermentasi biji kakao modern digelar untuk meningkatkan daya saing hasil panen petani kakao Mantikole.',
    'Edukasi',
    'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80',
    '00000000-0000-0000-0000-000000000001',
    true,
    76
) ON CONFLICT (slug) DO NOTHING;

-- 7. SEED LETTER TEMPLATES
INSERT INTO letter_templates (id, title, code, description, file_url, requirements)
VALUES
(
    '33333333-3333-3333-3333-333333333331',
    'Surat Keterangan Usaha (SKU)',
    'SKU',
    'Surat keterangan resmi dari desa untuk keperluan pembukaan rekening usaha, pengajuan KUR/Kredit perbankan, atau verifikasi izin usaha.',
    '/templates/template-sku-mantikole.docx',
    ARRAY['Kartu Tanda Penduduk (KTP) Pemohon', 'Kartu Keluarga (KK) Pemohon', 'Foto Bukti Kegiatan Usaha']
),
(
    '33333333-3333-3333-3333-333333333332',
    'Surat Keterangan Domisili (SKD)',
    'SKD',
    'Surat keterangan domisili tempat tinggal warga atau badan usaha di wilayah Desa Mantikole.',
    '/templates/template-skd-mantikole.docx',
    ARRAY['Kartu Tanda Penduduk (KTP) Pemohon', 'Kartu Keluarga (KK) Pemohon', 'Surat Pengantar RT/RW']
),
(
    '33333333-3333-3333-3333-333333333333',
    'Surat Keterangan Tidak Mampu (SKTM)',
    'SKTM',
    'Surat keterangan tidak mampu untuk persyaratan beasiswa pendidikan, keringanan biaya rumah sakit, atau bantuan sosial.',
    '/templates/template-sktm-mantikole.docx',
    ARRAY['Kartu Tanda Penduduk (KTP) Pemohon', 'Kartu Keluarga (KK) Pemohon', 'Surat Pengantar RT/RW', 'Foto Kondisi Rumah']
) ON CONFLICT (code) DO NOTHING;
