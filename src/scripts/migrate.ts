import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ ERROR: Variabel DATABASE_URL belum diatur di file .env');
    console.log('Silakan tambahkan DATABASE_URL=postgresql://... di file backend/.env');
    process.exit(1);
  }

  console.log('🔄 Menghubungkan ke PostgreSQL Database (Neon)...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('✅ Berhasil terhubung ke database!\n');

    // 1. Eksekusi Schema
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📦 Menjalankan migrasi tabel (schema.sql)...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('✅ Seluruh tabel database berhasil dibuat!\n');
    }

    // 2. Eksekusi Seed Data
    const seedPath = path.join(__dirname, '../db/seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Mengisi data awal resmi desa (seed.sql)...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedSql);
      console.log('✅ Data awal (admin, warta, wisata, perangkat, FAQ, template surat) berhasil di-seed!\n');
    }

    console.log('🎉 Migrasi Database Neon selesai 100%! Sistem siap digunakan.');
    client.release();
  } catch (err: any) {
    console.error('❌ Gagal menjalankan migrasi database:', err.message || err);
  } finally {
    await pool.end();
  }
}

runMigration();
