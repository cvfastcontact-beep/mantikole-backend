import { searchSimilarKnowledge } from './embedding.service';

const ipRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';

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
 * Enterprise Semantic RAG Chat Assistant:
 * 1. Embeds user question
 * 2. Retrieves Top-3 relevant chunks from Neon pgvector using Cosine Distance
 * 3. Injects ONLY the retrieved context into Gemini LLM prompt
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

  // 1. Semantic Retrieval: Top-3 relevant chunks from pgvector
  const relevantChunks = await searchSimilarKnowledge(message, 3);
  const sources = relevantChunks.map((c) => c.title);

  // Format retrieved context
  const contextSnippet = relevantChunks
    .map((c, i) => `[Dokumen ${i + 1}: ${c.title} (${c.source_type})]\n${c.content}`)
    .join('\n\n');

  // 2. If Gemini API Key is configured, call Google Gemini 1.5 Flash with minimal prompt
  if (GEMINI_API_KEY) {
    try {
      const systemInstruction = `Anda adalah "Mantikole AI", asisten digital cerdas dan ramah dari Desa Mantikole, Kecamatan Dolo Barat, Kabupaten Sigi, Sulawesi Tengah.
Gunakan salam khas lokal Sulawesi Tengah yang sopan seperti "Tabe!".
Jawablah pertanyaan warga atau pengunjung secara ringkas, jelas, dan akurat HANYA berdasarkan konteks dokumen resmi desa berikut.
Jika informasi tidak tersedia di konteks, sampaikan dengan ramah bahwa warga dapat menghubungi Kantor Desa Mantikole pada jam kerja (Senin-Jumat 08:00-15:00 WITA).

Konteks Resmi Desa:
${contextSnippet || 'Desa Mantikole, Kecamatan Dolo Barat, Kabupaten Sigi, Sulawesi Tengah.'}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nPertanyaan Warga: ${message}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const generatedText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          return {
            reply: generatedText.trim(),
            sources: sources.length > 0 ? sources : ['Basis Pengetahuan Resmi Desa Mantikole'],
          };
        }
      }
    } catch (err) {
      console.warn('[Gemini LLM Call Warning, falling back to direct context synthesis]:', err);
    }
  }

  // 3. Fallback: Direct Semantic Context Synthesis (High Accuracy & Zero Latency)
  if (relevantChunks.length > 0 && relevantChunks[0].similarity > 0.25) {
    const topChunk = relevantChunks[0];
    const reply = `Tabe! Berdasarkan informasi resmi desa (**${topChunk.title}**):\n\n${topChunk.content}`;
    return {
      reply,
      sources,
    };
  }

  // Default Greeting / Introduction
  const fallbackReply = `Tabe! Saya adalah **Mantikole AI**, Asisten Digital Resmi Desa Mantikole, Kecamatan Dolo Barat, Kabupaten Sigi.\n\n` +
    `Saya dapat membantu memberikan informasi akurat mengenai:\n` +
    `1. **Wisata Alam**: Tiket & fasilitas Pemandian Air Panas Alami & Air Terjun Mantikole.\n` +
    `2. **Layanan Surat**: Syarat berkas SKU, SKD, SKTM & cek status tiket resi.\n` +
    `3. **Komoditas Unggulan**: Hasil perkebunan Kakao fermentasi, Cengkeh, & Kelapa.\n` +
    `4. **Data Kependudukan**: Jumlah penduduk, KK, luas wilayah, & aparatur desa.\n` +
    `5. **Warta & Pengumuman**: Berita pembangunan dan agenda desa terbaru.\n\n` +
    `Ada yang dapat saya bantu?`;

  return {
    reply: fallbackReply,
    sources: ['Basis Pengetahuan Terpadu Desa Mantikole (Neon pgvector)'],
  };
}
