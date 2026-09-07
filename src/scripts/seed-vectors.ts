import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../config/db';
import { syncAllKnowledgeVectors } from '../services/embedding.service';

async function seedKnowledgeVectors() {
  console.log('🚀 Memulai Inisialisasi Vector Embeddings (Neon pgvector)...');
  const result = await syncAllKnowledgeVectors();
  console.log(`\n🎉 SELESAI! Sebanyak ${result.totalIndexed} data desa berhasil di-vectorize & di-index ke Neon pgvector!`);
  await pool.end();
}

seedKnowledgeVectors().catch((err) => {
  console.error('❌ Error seeding vectors:', err);
  pool.end();
});

