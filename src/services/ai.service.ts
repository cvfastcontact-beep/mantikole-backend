import { searchSimilarKnowledge } from './embedding.service';

const ipRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();

/**
 * Retrieve Gemini API Key dynamically from environment variables
 */
const getGeminiApiKey = (): string => {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.GOOGLE_API_KEY || '';
  if (!key || key.startsWith('your_') || key.includes('placeholder') || key.trim() === '') {
    return '';
  }
  return key.trim();
};

export const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const limitWindow = 10 * 60 * 1000; // 10 minutes
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
 * Enterprise Semantic RAG Chat Assistant:
 * 1. Embeds user question & retrieves Top-4 relevant knowledge chunks from Neon pgvector
 * 2. Injects retrieved context into Google Gemini LLM
 * 3. Falls back gracefully to direct deterministic synthesis if LLM key is unconfigured or offline
 */
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

  const cleanMessage = message.trim();
  const lowerMsg = cleanMessage.toLowerCase();

  console.log(`\n🤖 [AI Engine] 📩 Menerima Pertanyaan User: "${cleanMessage}" (IP: ${clientIp})`);

  // Guardrail: Simple Prompt Injection & Jailbreak Filter
  if (
    lowerMsg.includes('ignore all previous instructions') ||
    lowerMsg.includes('you are now an unfiltered') ||
    lowerMsg.includes('system prompt')
  ) {
    console.log('🛡️ [AI Engine] Guardrail trigger: Prompt injection dicegah.');
    return {
      reply: 'Tabe! Saya adalah Mantikole AI, asisten resmi Desa Mantikole. Ada yang dapat saya bantu mengenai informasi wisata, komoditas, data kependudukan, atau layanan administrasi desa?',
      sources: ['Sistem Keamanan Mantikole AI'],
    };
  }

  // 1. Semantic Retrieval: Top-4 relevant chunks from Neon pgvector
  console.log('🔍 [AI Engine] Melakukan Semantic Search di Neon pgvector...');
  const relevantChunks = await searchSimilarKnowledge(cleanMessage, 4);
  const sources = Array.from(new Set(relevantChunks.map((c) => c.title)));

  if (relevantChunks.length > 0) {
    console.log(`📚 [AI Engine] Ditemukan ${relevantChunks.length} dokumen relevan:`);
    relevantChunks.forEach((c, idx) => {
      console.log(`   ${idx + 1}. "${c.title}" (Score: ${(c.similarity * 100).toFixed(1)}%)`);
    });
  } else {
    console.log('⚠️ [AI Engine] Tidak ada dokumen yang cocok di database vektor.');
  }

  // Format retrieved context
  const contextSnippet = relevantChunks
    .map((c, i) => `[Dokumen ${i + 1}: ${c.title} (${c.source_type})]\n${c.content}`)
    .join('\n\n');

  const apiKey = getGeminiApiKey();
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  // 2. If Gemini API Key is configured, call Google Gemini LLM
  if (apiKey) {
    const maskedKey = apiKey.slice(0, 6) + '...' + apiKey.slice(-4);
    console.log(`🔑 [AI Engine] Menggunakan Gemini API Key: ${maskedKey} | Model: ${modelName}`);

    try {
      const systemInstruction = `Anda adalah "Mantikole AI", asisten digital cerdas, sopan, dan ramah resmi dari Pemerintah Desa Mantikole, Kecamatan Dolo Barat, Kabupaten Sigi, Sulawesi Tengah.

PANDUAN MENJAWAB:
1. Awali sapaan secara ramah dengan salam khas lokal Sulawesi Tengah seperti "Tabe!".
2. Jawablah pertanyaan warga atau pengunjung secara ringkas, terstruktur (gunakan format Markdown seperti **tebal**, poin daftar - atau 1. 2. 3. jika membantu), dan akurat HANYA berdasarkan konteks dokumen resmi desa yang dilampirkan.
3. JANGAN mengarang fakta atau berspekulasi di luar dokumen resmi desa.
4. Jika informasi spesifik tidak tercantum dalam dokumen konteks, sampaikan dengan sopan bahwa informasi detail dapat dikonfirmasi langsung ke Kantor Desa Mantikole pada jam kerja (Senin-Jumat 08:00 - 15:00 WITA) di Jl. Poros Palu - Kulawi.
5. Bersikaplah profesional, mengedepankan pelayanan publik prima, serta mempromosikan potensi wisata alam air panas dan komoditas kakao desa.`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      console.log(`🚀 [AI Engine] Mengirim prompt ke Google Gemini API...`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemInstruction}\n\n[DOKUMEN RESMI DESA MANTIKOLE]:\n${contextSnippet || 'Desa Mantikole, Kec. Dolo Barat, Kab. Sigi, Sulawesi Tengah.'}\n\n[PERTANYAAN WARGA/PENGUNJUNG]:\n${cleanMessage}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const generatedText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          console.log(`✅ [AI Engine] Sukses mendapatkan respon dari Google Gemini (${generatedText.length} karakter).`);
          return {
            reply: generatedText.trim(),
            sources: sources.length > 0 ? sources : ['Basis Pengetahuan Resmi Desa Mantikole'],
          };
        }
      } else {
        const errJson = await response.json().catch(() => null);
        console.error(`❌ [AI Engine Error] Google Gemini API HTTP ${response.status}:`, JSON.stringify(errJson, null, 2));
      }
    } catch (err: any) {
      console.error('❌ [AI Engine Error] Gagal memanggil Google Gemini LLM:', err.message || err);
    }
  } else {
    console.log('ℹ️ [AI Engine] GEMINI_API_KEY tidak ditemukan/kosong. Berjalan dalam mode Deterministic Synthesis.');
  }

  // 3. Fallback: Direct Semantic Context Synthesis (High Accuracy & Zero Latency)
  if (relevantChunks.length > 0 && relevantChunks[0].similarity > 0.2) {
    console.log('⚡ [AI Engine Fallback] Menggunakan sintesis data langsung dari basis pengetahuan pgvector.');
    const topChunk = relevantChunks[0];
    const reply = `Tabe! Berdasarkan informasi resmi desa (**${topChunk.title}**):\n\n${topChunk.content}\n\n*Informasi selengkapnya dapat dikonfirmasi langsung ke Kantor Desa Mantikole pada jam kerja (Senin-Jumat 08:00 - 15:00 WITA).*`;
    return {
      reply,
      sources,
    };
  }

  // 4. Default Greeting / Introduction
  console.log('ℹ️ [AI Engine] Pertanyaan di luar konteks database, mengembalikan pesan sapaan standar.');
  const fallbackReply = `Tabe! Saya adalah **Mantikole AI**, Asisten Digital Resmi Desa Mantikole, Kecamatan Dolo Barat, Kabupaten Sigi.\n\n` +
    `Saya dapat membantu memberikan informasi akurat mengenai:\n` +
    `- **Wisata Alam**: Tiket & fasilitas Pemandian Air Panas Alami & Air Terjun Mantikole.\n` +
    `- **Layanan Surat**: Syarat berkas SKU, SKD, SKTM & cek status tiket resi surat mandiri.\n` +
    `- **Komoditas Unggulan**: Hasil perkebunan Kakao fermentasi, Cengkeh, & Kelapa.\n` +
    `- **Data Kependudukan**: Jumlah penduduk, KK, luas wilayah, & aparatur desa.\n` +
    `- **Warta & Pengumuman**: Berita pembangunan dan agenda desa terbaru.\n\n` +
    `Ada yang dapat saya bantu?`;

  return {
    reply: fallbackReply,
    sources: ['Basis Pengetahuan Terpadu Desa Mantikole (Neon pgvector)'],
  };
}
