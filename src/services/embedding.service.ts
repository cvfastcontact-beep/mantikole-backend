import { pool } from '../config/db';

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

/**
 * Generate a 768-dimensional text embedding vector using Google Gemini gemini-embedding-001
 * Falls back gracefully to normalized deterministic pseudo-vector if API key is not yet set.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    return new Array(768).fill(0);
  }

  const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 2048);
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: cleanText }] },
          outputDimensionality: 768,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.embedding?.values && Array.isArray(data.embedding.values)) {
          return data.embedding.values;
        }
      } else {
        const errJson = await response.json().catch(() => null);
        console.warn('[Gemini Embedding API Warning]:', errJson || response.statusText);
      }
    } catch (err) {
      console.warn('[Embedding Service Fallback Active]:', err);
    }
  }

  // Deterministic local feature hashing fallback (768 dimensions) for offline resilience
  return generateDeterministicVector(cleanText, 768);
}

/**
 * Deterministic local feature hashing (Ponytail Zero-Dependency Resilience)
 */
function generateDeterministicVector(text: string, dimensions: number = 768): number[] {
  const vec = new Array(dimensions).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vec[idx] += 1 / Math.sqrt(words.length);
  }

  // L2 Normalize
  let norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) norm = 1;
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

/**
 * Format raw number array into PostgreSQL vector string literal: '[0.123, 0.456, ...]'
 */
export function formatVectorForPg(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

/**
 * Sync (UPSERT) a document chunk to knowledge_vectors table
 */
export async function syncKnowledgeVector(
  sourceType: string,
  sourceId: string,
  title: string,
  content: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const combinedText = `${title}\n${content}`;
    const embedding = await generateEmbedding(combinedText);
    const vectorLiteral = formatVectorForPg(embedding);

    const query = `
      INSERT INTO knowledge_vectors (source_type, source_id, title, content, metadata, embedding, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6::vector, CURRENT_TIMESTAMP)
      ON CONFLICT (source_type, source_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding,
        updated_at = CURRENT_TIMESTAMP;
    `;

    await pool.query(query, [
      sourceType,
      sourceId,
      title,
      content,
      JSON.stringify(metadata),
      vectorLiteral,
    ]);
  } catch (err) {
    console.error(`[Embedding Sync Error for ${sourceType}:${sourceId}]:`, err);
  }
}

/**
 * Delete knowledge vector record on CMS delete
 */
export async function deleteKnowledgeVector(sourceType: string, sourceId: string): Promise<void> {
  try {
    await pool.query(
      'DELETE FROM knowledge_vectors WHERE source_type = $1 AND source_id = $2',
      [sourceType, sourceId]
    );
  } catch (err) {
    console.error(`[Embedding Delete Error for ${sourceType}:${sourceId}]:`, err);
  }
}

/**
 * Perform Cosine Distance Semantic Search in Neon pgvector
 * Returns top-K most relevant knowledge chunks
 */
export async function searchSimilarKnowledge(
  queryText: string,
  limit: number = 4
): Promise<Array<{ title: string; content: string; source_type: string; similarity: number }>> {
  try {
    const queryVector = await generateEmbedding(queryText);
    const vectorLiteral = formatVectorForPg(queryVector);

    const sql = `
      SELECT 
        title, 
        content, 
        source_type, 
        metadata,
        (1 - (embedding <=> $1::vector)) AS similarity
      FROM knowledge_vectors
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector ASC
      LIMIT $2;
    `;

    const result = await pool.query(sql, [vectorLiteral, limit]);
    return result.rows;
  } catch (err) {
    console.error('[pgvector Search Error]:', err);
    return [];
  }
}

/**
 * Full knowledge vector re-sync utility (Syncs all FAQs, Articles, Highlights, Staff & Village Profile)
 */
export async function syncAllKnowledgeVectors(): Promise<{ totalIndexed: number }> {
  let count = 0;

  // 1. Village Profile Knowledge
  const villageProfiles = [
    {
      id: 'profile-general',
      title: 'Profil Umum & Geografis Desa Mantikole',
      content: 'Desa Mantikole terletak di Kecamatan Dolo Barat, Kabupaten Sigi, Provinsi Sulawesi Tengah. Memiliki luas wilayah sekitar 18.5 km2 dengan topografi perbukitan dan lembah subur di tepi Sungai Palu.',
      type: 'profile',
    },
    {
      id: 'profile-tourism-hotspring',
      title: 'Pemandian Air Panas Alami Mantikole',
      content: 'Pemandian Air Panas Alami Mantikole merupakan destinasi wisata unggulan dengan kolam air panas alami bersumber dari mata air belerang pegunungan. Tiket masuk: Rp 5.000 (Dewasa) dan Rp 3.000 (Anak-anak). Fasilitas: Gazebo, kamar bilas, kantin, spot foto alami, dan area parkir luas.',
      type: 'highlight',
    },
    {
      id: 'profile-services',
      title: 'Pelayanan Kantor Desa & Pengajuan Surat',
      content: 'Pelayanan fisik Kantor Desa Mantikole buka Senin hingga Jumat pukul 08:00 - 15:00 WITA di Jl. Poros Palu - Kulawi. Warga dapat mengajukan Surat Keterangan Usaha (SKU), Surat Keterangan Domisili (SKD), dan Surat Keterangan Tidak Mampu (SKTM) secara online melalui website desa.',
      type: 'service',
    },
  ];

  for (const item of villageProfiles) {
    await syncKnowledgeVector(item.type, item.id, item.title, item.content);
    count++;
  }

  // 2. FAQs
  try {
    const faqRes = await pool.query('SELECT id, question, answer, category FROM faqs');
    for (const faq of faqRes.rows) {
      await syncKnowledgeVector('faq', String(faq.id), faq.question, faq.answer, { category: faq.category });
      count++;
    }
  } catch (e) {}

  // 3. Articles
  try {
    const artRes = await pool.query("SELECT id, title, content, summary, category FROM articles WHERE is_published = true");
    for (const art of artRes.rows) {
      await syncKnowledgeVector('article', String(art.id), art.title, `${art.summary || ''}\n${art.content}`, { category: art.category });
      count++;
    }
  } catch (e) {}

  // 4. Village Highlights
  try {
    const hlRes = await pool.query('SELECT id, title, short_description, full_description, type FROM village_highlights');
    for (const hl of hlRes.rows) {
      await syncKnowledgeVector('highlight', String(hl.id), `${hl.title} (${hl.type})`, `${hl.short_description}\n${hl.full_description}`, { type: hl.type });
      count++;
    }
  } catch (e) {}

  // 5. Staff / Aparatur
  try {
    const staffRes = await pool.query('SELECT id, name, role, description FROM village_staff');
    for (const staff of staffRes.rows) {
      await syncKnowledgeVector('staff', String(staff.id), `Perangkat Desa: ${staff.name} (${staff.role})`, `Nama: ${staff.name}, Jabatan: ${staff.role}. ${staff.description || ''}`, { role: staff.role });
      count++;
    }
  } catch (e) {}

  return { totalIndexed: count };
}
