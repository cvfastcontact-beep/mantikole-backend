import { pool } from '../config/db';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';

/**
 * Generate a 768-dimensional text embedding vector using Google Gemini text-embedding-004
 * Falls back gracefully to normalized pseudo-vector if API key is not yet set.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    return new Array(768).fill(0);
  }

  const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 2048);

  if (GEMINI_API_KEY) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: cleanText }] },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.embedding?.values && Array.isArray(data.embedding.values)) {
          return data.embedding.values;
        }
      } else {
        const errJson = await response.json().catch(() => null);
        console.warn('[Embedding API Warning]:', errJson || response.statusText);
      }
    } catch (err) {
      console.warn('[Embedding Service Fallback Active]:', err);
    }
  }

  // Deterministic local feature hashing fallback (768 dimensions) for offline resilience
  return generateDeterministicVector(cleanText, 768);
}

/**
 * Deterministic local feature hashing (Ponytail Resilience)
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
