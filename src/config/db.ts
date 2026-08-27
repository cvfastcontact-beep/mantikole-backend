import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ WARNING: DATABASE_URL tidak ditemukan di file .env. Pastikan koneksi Neon PostgreSQL telah dikonfigurasi.');
}

export const pool = new Pool({
  connectionString: connectionString || 'postgresql://localhost:5432/mantikole_db',
  ssl: { rejectUnauthorized: false },
});
