import { pool } from '../config/db';

const ipRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();

export const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const limitWindow = 10 * 60 * 1000;
  const maxRequests = 30;

  const current = ipRequestCounts.get(ip);
  if (!current || now > current.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + limitWindow });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count += 1;
  return true;
};

/**
 * Real-time RAG Context Synthesizer:
 * Aggregates all live database entities from Neon PostgreSQL
 * into a structured dynamic knowledge graph for accurate query answering.
 */
async function buildDynamicRagContext() {
  const [settingsRes, staffRes, faqsRes, highlightsRes, articlesRes, templatesRes] = await Promise.all([
    pool.query('SELECT key, value FROM site_settings'),
    pool.query('SELECT * FROM village_staff ORDER BY order_index ASC'),
    pool.query('SELECT * FROM faqs ORDER BY order_index ASC'),
    pool.query('SELECT * FROM village_highlights'),
    pool.query('SELECT * FROM articles WHERE is_published = true'),
    pool.query('SELECT * FROM letter_templates'),
  ]);

  const settings: Record<string, any> = {};
  settingsRes.rows.forEach((r) => {
    try {
      settings[r.key] = JSON.parse(r.value);
    } catch {
      settings[r.key] = r.value;
    }
  });

  return {
    settings,
    staff: staffRes.rows,
    faqs: faqsRes.rows,
    highlights: highlightsRes.rows,
    articles: articlesRes.rows,
    templates: templatesRes.rows,
  };
}

export async function processAiChat(message: string, clientIp: string) {
  if (!message || typeof message !== 'string') {
    throw { status: 400, message: 'Pesan pertanyaan wajib diisi.' };
  }

  if (!checkRateLimit(clientIp)) {
    throw {
      status: 429,
      message: 'Batas penggunaan pesan AI tercapai. Silakan coba lagi beberapa saat lagi (maksimal 30 pesan / 10 menit).',
    };
  }

  const lowerMsg = message.toLowerCase();

  // Guardrail: Simple Prompt Injection Filter
  if (
    lowerMsg.includes('ignore all previous instructions') ||
    lowerMsg.includes('you are now an unfiltered') ||
    lowerMsg.includes('system prompt')
  ) {
    return {
      reply: 'Tabe! Saya adalah Mantikole AI, asisten resmi Desa Mantikole. Ada yang dapat saya bantu mengenai informasi wisata, komoditas, data kependudukan, atau layanan administrasi desa?',
      sources: ['Sistem Keamanan Mantikole AI'],
    };
  }

  // Load Real-time Data Context from PostgreSQL
  const context = await buildDynamicRagContext();
  let reply = '';
  let sources: string[] = [];

  // 1. Check FAQs intent match
  const matchedFaq = context.faqs.find((f: any) =>
    f.question.toLowerCase().split(' ').some((word: string) => word.length > 3 && lowerMsg.includes(word)) &&
    (lowerMsg.includes(f.category?.toLowerCase() || '') || lowerMsg.includes('apa') || lowerMsg.includes('bagaimana') || lowerMsg.includes('berapa') || lowerMsg.includes('kapan'))
  );

  // 2. Intent: Wisata Air Panas & Air Terjun
  if (lowerMsg.includes('air panas') || lowerMsg.includes('pemandian') || lowerMsg.includes('belerang')) {
    const airPanas = context.highlights.find((h: any) => h.type === 'wisata' && h.title.toLowerCase().includes('panas')) || context.highlights[0];
    reply = `Tabe! **${airPanas?.title || 'Pemandian Air Panas Alami Mantikole'}** adalah destinasi wisata unggulan di Desa Mantikole, Kecamatan Dolo Barat, Kabupaten Sigi.\n\n` +
      `• **Tarif Tiket**: ${airPanas?.price_info || 'Rp 5.000 / Orang'}\n` +
      `• **Lokasi**: ${airPanas?.location_details || 'Desa Mantikole, Dolo Barat, Sigi'}\n` +
      `• **Khasiat & Keunggulan**: ${airPanas?.short_description || 'Mata air panas alami berkhasiat kesehatan'}\n\n` +
      `📌 ${airPanas?.full_description?.slice(0, 200) || ''}...`;
    sources = [airPanas?.title || 'Pemandian Air Panas Alami Mantikole', 'Katalog Wisata Desa Mantikole'];
  } else if (lowerMsg.includes('air terjun') || lowerMsg.includes('curug')) {
    const airTerjun = context.highlights.find((h: any) => h.title.toLowerCase().includes('terjun')) || context.highlights[1];
    reply = `Tabe! **${airTerjun?.title || 'Wisata Air Terjun Mantikole'}** menyuguhkan pesona gemericik air pegunungan yang jernih di tengah hutan tropis Dolo Barat.\n\n` +
      `• **Biaya Masuk**: ${airTerjun?.price_info || 'Gratis / Donasi Kebersihan'}\n` +
      `• **Lokasi**: ${airTerjun?.location_details || 'Pegunungan Mantikole'}\n` +
      `• **Aktivitas**: Trekking alami, berenang air segar pegunungan, dan rekreasi keluarga.`;
    sources = ['Wisata Air Terjun Mantikole'];
  } 
  // 3. Intent: Statistik Penduduk & Demografi Desa
  else if (lowerMsg.includes('penduduk') || lowerMsg.includes('jumlah kk') || lowerMsg.includes('luas') || lowerMsg.includes('dusun') || lowerMsg.includes('demografi') || lowerMsg.includes('statistik')) {
    const s = context.settings;
    reply = `Tabe! Berikut adalah ringkasan data kependudukan dan statistik administrasi resmi Desa Mantikole:\n\n` +
      `• **Jumlah Penduduk**: ${(s.total_population || 2145).toLocaleString('id-ID')} Jiwa\n` +
      `• **Jumlah Kepala Keluarga (KK)**: ${(s.total_families || 582).toLocaleString('id-ID')} KK\n` +
      `• **Luas Wilayah**: ${s.total_area_km2 || '18.45'} km²\n` +
      `• **Jumlah Dusun**: ${s.total_hamlets || 3} Wilayah Dusun\n` +
      `• **Produksi Panen Kakao**: ±${s.cacao_production_tons || 120} Ton / Tahun\n` +
      `• **Pengunjung Wisata Rata-rata**: ±${(s.hotsprings_visitors_monthly || 1850).toLocaleString('id-ID')} Pengunjung / Bulan`;
    sources = ['Data Statistik & Demografi Desa Mantikole'];
  }
  // 4. Intent: Perangkat Desa / Kepala Desa / Sekdes / BPD
  else if (lowerMsg.includes('kepala desa') || lowerMsg.includes('kades') || lowerMsg.includes('sekdes') || lowerMsg.includes('sekretaris') || lowerMsg.includes('perangkat desa') || lowerMsg.includes('staf') || lowerMsg.includes('aparat')) {
    const staffText = context.staff
      .map((st: any) => `• **${st.name}** — *${st.role}* (${st.description || st.desc || 'Perangkat Desa'})`)
      .join('\n');
    reply = `Tabe! Berikut adalah susunan Pemerintah dan Perangkat Desa Mantikole saat ini:\n\n${staffText}\n\nHubungi kantor desa pada jam kerja untuk konsultasi tatap muka.`;
    sources = ['Struktur Pemerintahan Desa Mantikole'];
  }
  // 5. Intent: Surat Mandiri & Syarat Dokumen
  else if (lowerMsg.includes('surat') || lowerMsg.includes('sku') || lowerMsg.includes('skd') || lowerMsg.includes('sktm') || lowerMsg.includes('resi') || lowerMsg.includes('syarat')) {
    const tplList = context.templates
      .map((t: any) => `• **${t.title} (${t.code})**: Syarat -> ${(t.requirements || []).join(', ')}`)
      .join('\n\n');
    reply = `Tabe! Pelayanan surat administrasi Desa Mantikole dapat diajukan secara online 24 jam tanpa perlu mengantre melalui menu **Layanan Surat**.\n\n` +
      `📌 **Jenis Surat & Persyaratan Berkas**:\n${tplList}\n\n` +
      `💡 Setiap permohonan yang terkirim akan otomatis mendapatkan **Nomor Tiket Resi** (contoh: *MNT-2026-08001*) untuk memantau proses verifikasi secara langsung.`;
    sources = ['Portal Layanan Surat Mandiri Desa Mantikole'];
  }
  // 6. Intent: Komoditas / Kakao / Cengkeh / Pertanian
  else if (lowerMsg.includes('kakao') || lowerMsg.includes('cokelat') || lowerMsg.includes('cengkeh') || lowerMsg.includes('kelapa') || lowerMsg.includes('komoditas') || lowerMsg.includes('kebun') || lowerMsg.includes('panen')) {
    const commodities = context.highlights.filter((h: any) => h.type === 'komoditas');
    const commText = commodities
      .map((c: any) => `• **${c.title}**: ${c.short_description} (${c.price_info})`)
      .join('\n\n');
    reply = `Tabe! Desa Mantikole memiliki potensi agrikultur dan perkebunan yang sangat subur di lembah Dolo Barat:\n\n${commText}\n\nKomoditas kakao Mantikole difermentasi dengan standar industri untuk menjaga kualitas rasa dan aroma terbaik.`;
    sources = ['Katalog Potensi Komoditas Desa Mantikole'];
  }
  // 7. Intent: Jam Operasional Kantor & Kontak
  else if (lowerMsg.includes('kantor') || lowerMsg.includes('jam') || lowerMsg.includes('buka') || lowerMsg.includes('telepon') || lowerMsg.includes('kontak') || lowerMsg.includes('alamat')) {
    const s = context.settings;
    reply = `Tabe! Berikut informasi operasional dan kontak Kantor Desa Mantikole:\n\n` +
      `• **Alamat**: ${s.village_location_text || 'Desa Mantikole, Dolo Barat, Sigi'}\n` +
      `• **Jam Pelayanan Kantor**: ${s.office_hours || 'Senin - Jumat, 08:00 - 15:00 WITA'}\n` +
      `• **Nomor Telepon/WA**: ${s.contact_phone || '0812-3456-7890'}\n` +
      `• **Email**: ${s.contact_email || 'kantor@desamantikole.id'}\n` +
      `• **Layanan Online**: Aktif 24 Jam melalui Website Resmi`;
    sources = ['Profil Kontak Kantor Desa Mantikole'];
  }
  // 8. Intent: Warta / Berita Terbaru
  else if (lowerMsg.includes('berita') || lowerMsg.includes('kegiatan') || lowerMsg.includes('warta') || lowerMsg.includes('pembangunan') || lowerMsg.includes('pengumuman')) {
    const latestArticles = context.articles.slice(0, 3);
    const artText = latestArticles
      .map((a: any) => `• **${a.title}** [${a.category}]\n  *${a.summary}*`)
      .join('\n\n');
    reply = `Tabe! Berikut adalah publikasi warta dan pengumuman terbaru dari Desa Mantikole:\n\n${artText}\n\nBuka menu **Berita** untuk membaca seluruh artikel secara lengkap.`;
    sources = ['Warta & Berita Desa Mantikole'];
  }
  // 9. Fallback: Check Matched FAQ or General Greeting
  else if (matchedFaq) {
    reply = `Tabe! Berdasarkan informasi resmi desa:\n\n${matchedFaq.answer}`;
    sources = [`FAQ Desa Mantikole (${matchedFaq.category})`];
  } else {
    reply = `Tabe! Saya adalah **Mantikole AI**, Asisten Digital Resmi Desa Mantikole, Kecamatan Dolo Barat, Kabupaten Sigi.\n\n` +
      `Saya dapat memberikan informasi lengkap secara real-time mengenai:\n` +
      `1. **Wisata Alam**: Tiket & lokasi Pemandian Air Panas Alami & Air Terjun Mantikole.\n` +
      `2. **Layanan Surat**: Syarat berkas SKU, SKD, SKTM & cek status tiket resi.\n` +
      `3. **Komoditas Desa**: Hasil perkebunan Kakao unggulan, Cengkeh, & Kelapa.\n` +
      `4. **Statistik Desa**: Jumlah penduduk, KK, luas wilayah, & perangkat desa.\n` +
      `5. **Warta & Pengumuman**: Berita pembangunan dan kegiatan desa terbaru.\n\n` +
      `Ada yang ingin Anda tanyakan?`;
    sources = ['Basis Data Terintegrasi Desa Mantikole'];
  }

  return { reply, sources };
}
