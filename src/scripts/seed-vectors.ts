import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../config/db';
import { syncKnowledgeVector } from '../services/embedding.service';

async function seedKnowledgeVectors() {
  console.log('🚀 Memulai Inisialisasi Vector Embeddings (Neon pgvector)...');

  // 1. Index Site Settings & Profil Desa
  console.log('\n🏛️ Mengindeks Profil & Pengaturan Desa...');
  const settingsRes = await pool.query('SELECT key, value FROM site_settings');
  const settings: Record<string, string> = {};
  settingsRes.rows.forEach((r) => {
    try {
      settings[r.key] = JSON.parse(r.value);
    } catch {
      settings[r.key] = r.value;
    }
  });

  await syncKnowledgeVector(
    'setting',
    'village-profile',
    'Profil & Geografis Desa Mantikole',
    `Desa Mantikole berlokasi di ${settings.village_location_text || 'Kecamatan Dolo Barat, Kabupaten Sigi, Sulawesi Tengah'}. ` +
      `Jam operasional kantor desa: ${settings.office_hours || 'Senin - Jumat 08:00 - 15:00 WITA'}. ` +
      `Kontak telepon: ${settings.contact_phone || '0812-3456-7890'}, email: ${settings.contact_email || 'kantor@desamantikole.id'}. ` +
      `Total penduduk: ${settings.total_population || 2145} jiwa, ${settings.total_families || 582} KK, luas wilayah ${settings.total_area_km2 || '18.45'} km2, terdiri dari ${settings.total_hamlets || 3} dusun. ` +
      `Produksi kakao tahunan: ${settings.cacao_production_tons || 120} ton. Pengunjung pemandian air panas rata-rata ${settings.hotsprings_visitors_monthly || 1850} orang/bulan.`,
    { category: 'Profil' }
  );

  // 2. Index FAQs
  console.log('\n❓ Mengindeks Tanya Jawab (FAQ)...');
  const faqsRes = await pool.query('SELECT * FROM faqs');
  for (const faq of faqsRes.rows) {
    await syncKnowledgeVector(
      'faq',
      faq.id,
      faq.question,
      faq.answer,
      { category: faq.category, order_index: faq.order_index }
    );
    console.log(`  ✅ Vectorized FAQ: "${faq.question.slice(0, 45)}..."`);
  }

  // 3. Index Wisata & Komoditas Highlights
  console.log('\n🏕️ Mengindeks Wisata & Komoditas Unggulan...');
  const highlightsRes = await pool.query('SELECT * FROM village_highlights');
  for (const hl of highlightsRes.rows) {
    await syncKnowledgeVector(
      'highlight',
      hl.id,
      `${hl.title} (${hl.type})`,
      `${hl.short_description}\n${hl.full_description}\nLokasi: ${hl.location_details}\nInfo Tarif/Biaya: ${hl.price_info}`,
      { type: hl.type, slug: hl.slug }
    );
    console.log(`  ✅ Vectorized Highlight: "${hl.title}"`);
  }

  // 4. Index Warta & Berita
  console.log('\n📰 Mengindeks Warta & Berita Desa...');
  const articlesRes = await pool.query('SELECT * FROM articles WHERE is_published = true');
  for (const art of articlesRes.rows) {
    await syncKnowledgeVector(
      'article',
      art.id,
      art.title,
      `${art.summary}\n${art.content}`,
      { category: art.category, slug: art.slug }
    );
    console.log(`  ✅ Vectorized Article: "${art.title.slice(0, 45)}..."`);
  }

  // 5. Index Perangkat Desa
  console.log('\n👥 Mengindeks Struktur Aparatur Desa...');
  const staffRes = await pool.query('SELECT * FROM village_staff');
  for (const staff of staffRes.rows) {
    await syncKnowledgeVector(
      'staff',
      staff.id,
      `${staff.name} - ${staff.role}`,
      `Perangkat desa Mantikole: ${staff.name} menjabat sebagai ${staff.role}. ${staff.description || ''}`,
      { role: staff.role, order_index: staff.order_index }
    );
    console.log(`  ✅ Vectorized Staff: "${staff.name} (${staff.role})"`);
  }

  // 6. Index Panduan Layanan Surat
  console.log('\n📜 Mengindeks Panduan Permohonan Surat Digital...');
  const templatesRes = await pool.query('SELECT * FROM letter_templates');
  for (const tmpl of templatesRes.rows) {
    const reqs = Array.isArray(tmpl.requirements) ? tmpl.requirements.join(', ') : tmpl.requirements;
    await syncKnowledgeVector(
      'guide',
      tmpl.code,
      `Panduan Permohonan ${tmpl.title} (${tmpl.code})`,
      `Jenis surat: ${tmpl.title} (${tmpl.code}). ${tmpl.description || ''}. ` +
        `Persyaratan dokumen yang harus disiapkan: ${reqs}. ` +
        `Pengajuan dilakukan online di website desa melalui menu "Layanan Surat" dengan memasukkan NIK 16 digit, data pemohon, dan nomor WhatsApp aktif untuk menerima nomor resi pelacakan.`,
      { code: tmpl.code }
    );
    console.log(`  ✅ Vectorized Template: "${tmpl.title}"`);
  }

  console.log('\n🎉 SEMUA DATA DESA BERHASIL DI-VECTORIZE & DI-INDEX KE PGVECTOR NEON!');
  await pool.end();
}

seedKnowledgeVectors().catch((err) => {
  console.error('❌ Error seeding vectors:', err);
  pool.end();
});
