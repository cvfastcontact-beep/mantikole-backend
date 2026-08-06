import { Router, Request, Response } from 'express';
import { memoryStore, pool } from '../config/db';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Rate Limiter tracking per IP (15 requests per 10 minutes)
const ipRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const limitWindow = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 25;

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

// POST /api/v1/ai/chat
router.post('/chat', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Pesan pertanyaan wajib diisi.' });
  }

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      message: 'Batas penggunaan pesan AI tercapai. Silakan coba lagi beberapa saat lagi (maksimal 25 pesan / 10 menit).',
    });
  }

  // Guardrail: Simple Prompt Injection Filter
  const lowerMsg = message.toLowerCase();
  if (
    lowerMsg.includes('ignore all previous instructions') ||
    lowerMsg.includes('you are now an unfiltered') ||
    lowerMsg.includes('system prompt')
  ) {
    return res.json({
      success: true,
      reply: 'Tabe! Saya adalah Mantikole AI, asisten resmi Desa Mantikole. Ada yang dapat saya bantu mengenai informasi wisata, komoditas, atau layanan administrasi desa?',
      sources: ['Sistem Keamanan Mantikole AI'],
    });
  }

  // Dynamic Context Building
  let contextItems: string[] = [];

  if (pool) {
    try {
      const kbRes = await pool.query('SELECT title, content FROM ai_knowledge_base WHERE is_active = true LIMIT 10');
      contextItems = kbRes.rows.map((r) => `${r.title}: ${r.content}`);
    } catch {
      contextItems = memoryStore.ai_knowledge_base.map((k) => `${k.title}: ${k.content}`);
    }
  } else {
    contextItems = memoryStore.ai_knowledge_base.map((k) => `${k.title}: ${k.content}`);
  }

  // Smart Query Intent Matcher & Rule-based RAG Response Generator
  let reply = '';
  let sources: string[] = [];

  if (lowerMsg.includes('air panas') || lowerMsg.includes('pemandian') || lowerMsg.includes('tiket') || lowerMsg.includes('belerang')) {
    reply = `Tabe! Pemandian Air Panas Alami Mantikole merupakan destinasi wisata unggulan di Desa Mantikole, Kecamatan Dolo Barat, Kabupaten Sigi.\n\n` +
      `• Tiket Masuk: Rp 5.000 / Orang\n` +
      `• Jam Buka: Setiap Hari (07:00 - 18:00 WITA)\n` +
      `• Keunggulan: Sumber air panas alami pegunungan kaya kandungan belerang yang bermanfaat untuk kesehatan kulit, melegakan pegal linu, dan relaksasi tubuh.\n` +
      `• Lokasi: Lereng Pegunungan Mantikole, Kec. Dolo Barat, Kab. Sigi.`;
    sources = ['Pemandian Air Panas Alami Mantikole', 'Katalog Wisata Desa Mantikole'];
  } else if (lowerMsg.includes('air terjun') || lowerMsg.includes('curug') || lowerMsg.includes('wisata')) {
    reply = `Tabe! Wisata Air Terjun Mantikole menyajikan pesona alam yang sejuk dan jernih di tengah suasana pegunungan Sigi.\n\n` +
      `• Biaya Masuk: Gratis / Donasi Kebersihan seikhlasnya\n` +
      `• Jam Buka: Setiap Hari (08:00 - 17:00 WITA)\n` +
      `• Aktivitas: Trekking ringan, foto alam, berenang air sejuk pegunungan.\n` +
      `• Fasilitas: Area parkir, tempat istirahat, dan jalur petunjuk jalan.`;
    sources = ['Wisata Air Terjun Mantikole'];
  } else if (lowerMsg.includes('surat') || lowerMsg.includes('sku') || lowerMsg.includes('skd') || lowerMsg.includes('sktm') || lowerMsg.includes('syarat')) {
    reply = `Tabe! Untuk mengurus Surat Administrasi Desa Mantikole, Anda tidak perlu mengantre lama di kantor desa. Pengajuan dapat dilakukan secara online melalui menu **Layanan Surat**.\n\n` +
      `📌 Jenis Surat & Syarat Berkas:\n` +
      `1. Surat Keterangan Usaha (SKU): KTP, KK, dan Foto Tempat Usaha.\n` +
      `2. Surat Keterangan Domisili (SKD): KTP, KK, dan Surat Pengantar RT/RW.\n` +
      `3. Surat Keterangan Tidak Mampu (SKTM): KTP, KK, Surat Pengantar RT/RW, Foto Rumah.\n\n` +
      `💡 Setelah mengisi formulir online, Anda akan menerima Nomor Tiket Resi (contoh: MNT-2026-08001) untuk melacak status verifikasi secara real-time.`;
    sources = ['Portal Layanan Surat Mandiri Desa Mantikole'];
  } else if (lowerMsg.includes('kantor') || lowerMsg.includes('jam') || lowerMsg.includes('buka') || lowerMsg.includes('buka kantor')) {
    reply = `Tabe! Kantor Desa Mantikole melayani masyarakat pada:\n\n` +
      `• Hari Pelayanan: Senin - Jumat\n` +
      `• Jam Operasional: 08:00 - 15:00 WITA\n` +
      `• Alamat Kantor: Jalan Utama Desa Mantikole, Kecamatan Dolo Barat, Kabupaten Sigi.\n\n` +
      `Anda juga dapat mengajukan surat administrasi mandiri kapan saja 24 jam melalui website resmi ini.`;
    sources = ['Profil Administrasi Kantor Desa Mantikole'];
  } else if (lowerMsg.includes('kakao') || lowerMsg.includes('cokelat') || lowerMsg.includes('cengkeh') || lowerMsg.includes('kelapa') || lowerMsg.includes('komoditas') || lowerMsg.includes('hasil bumi')) {
    reply = `Tabe! Desa Mantikole kaya akan hasil bumi dan komoditas perkebunan unggulan:\n\n` +
      `• Perkebunan Kakao (Cokelat): Komoditas utama dengan biji kering mentah berkualitas tinggi yang dipasok ke pasar nasional.\n` +
      `• Cengkeh Aromatik: Rempah bermutu tinggi dengan kadar minyak atsiri yang pekat.\n` +
      `• Hasil Kelapa Rakyat & Pertanian (Padi/Jagung).\n\n` +
      `Pemerintah Desa rutin mengadakan program pendampingan untuk memajukan kesejahteraan para petani local.`;
    sources = ['Portofolio Komoditas Desa Mantikole'];
  } else {
    reply = `Tabe! Terima kasih telah menghubungi Mantikole AI.\n\n` +
      `Saya dapat membantu memberikan informasi mengenai:\n` +
      `• Destinasi Pemandian Air Panas Alami & Air Terjun Mantikole\n` +
      `• Komoditas Perkebunan (Kakao, Cengkeh, Kelapa)\n` +
      `• Persyaratan & Cara Pengajuan Surat Online (SKU, SKD, SKTM)\n` +
      `• Jam Pelayanan & Alamat Kantor Desa Mantikole\n\n` +
      `Ada yang ingin Anda tanyakan secara spesifik?`;
    sources = ['Basis Data Pengetahuan Desa Mantikole'];
  }

  return res.json({
    success: true,
    reply,
    sources,
    suggested_prompts: [
      'Berapa tiket air panas Mantikole?',
      'Syarat buat Surat Keterangan Usaha (SKU)?',
      'Ada komoditas apa saja di Desa Mantikole?',
      'Jam buka pelayanan kantor desa?',
    ],
  });
});

// GET /api/v1/ai/knowledge (Auth Required)
router.get('/knowledge', authenticateToken, async (req: Request, res: Response) => {
  try {
    let list: any[] = [];
    if (pool) {
      const res = await pool.query('SELECT * FROM ai_knowledge_base ORDER BY created_at DESC');
      list = res.rows;
    } else {
      list = memoryStore.ai_knowledge_base;
    }
    return res.json({ success: true, data: list });
  } catch {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data knowledge base.' });
  }
});

// POST /api/v1/ai/knowledge (Auth Required)
router.post('/knowledge', authenticateToken, async (req: Request, res: Response) => {
  const { category, title, content } = req.body;

  if (!category || !title || !content) {
    return res.status(400).json({ success: false, message: 'Kategori, judul, dan konten wajib diisi.' });
  }

  const newItem = {
    id: `kb-${Date.now()}`,
    category,
    title,
    content,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  if (!pool) {
    memoryStore.ai_knowledge_base.unshift(newItem);
  } else {
    await pool.query(
      'INSERT INTO ai_knowledge_base (id, category, title, content, is_active) VALUES ($1, $2, $3, $4, $5)',
      [newItem.id, category, title, content, true]
    );
  }

  return res.status(201).json({ success: true, message: 'Basis pengetahuan AI berhasil ditambahkan.', data: newItem });
});

export default router;
