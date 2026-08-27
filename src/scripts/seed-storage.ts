import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import https from 'https';

dotenv.config();

const BUCKET = process.env.NEON_STORAGE_BUCKET || 'mantikole-media';
const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || 'us-east-2';

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error('❌ Kredensial S3 Neon tidak lengkap di backend/.env');
  process.exit(1);
}

const s3 = new S3Client({
  endpoint,
  region,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const data: Uint8Array[] = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadToNeonS3(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  const publicUrl = `${endpoint}/${BUCKET}/${key}`;
  console.log(`  ✅ Uploaded: ${key} -> ${publicUrl}`);
  return publicUrl;
}

async function runStorageSeeding() {
  console.log(`🚀 Memulai Migrasi & Upload Seluruh Media ke Neon Object Storage (${BUCKET})...`);

  // 1. Upload Perangkat Desa Staff Photos
  console.log('\n👥 Mengunggah Foto Perangkat Desa...');
  const staffFiles = [
    { id: '00000000-0000-0000-0000-000000000011', file: 'kepala_desa.png' },
    { id: '00000000-0000-0000-0000-000000000012', file: 'sekretaris_desa.png' },
    { id: '00000000-0000-0000-0000-000000000013', file: 'ketua_bpd.png' },
    { id: '00000000-0000-0000-0000-000000000014', file: 'kaur_keuangan.png' },
    { id: '00000000-0000-0000-0000-000000000015', file: 'kasi_pemerintahan.png' },
  ];

  const localPerangkatDir = path.join(__dirname, '../../../frontend/public/images/perangkat');

    for (const item of staffFiles) {
      const filePath = path.join(localPerangkatDir, item.file);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const s3Url = await uploadToNeonS3(`staff/${item.file}`, buffer, 'image/png');
        await pool.query('UPDATE village_staff SET image_url = $1 WHERE image_url LIKE $2 OR id = $3', [s3Url, `%${item.file}%`, item.id]);
      }
    }

  // 2. Upload Wisata & Komoditas Images
  console.log('\n🏕️ Mengunggah Gambar Destinasi & Komoditas...');
  const highlights = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      key: 'wisata/air-panas-mantikole.jpg',
      url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      key: 'komoditas/perkebunan-kakao.jpg',
      url: 'https://images.unsplash.com/photo-1541336032412-2048a678540d?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111113',
      key: 'wisata/air-terjun-mantikole.jpg',
      url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111114',
      key: 'komoditas/cengkeh-kelapa.jpg',
      url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop',
    },
  ];

  for (const h of highlights) {
    try {
      const buffer = await downloadBuffer(h.url);
      const s3Url = await uploadToNeonS3(h.key, buffer, 'image/jpeg');
      await pool.query('UPDATE village_highlights SET gallery_urls = $1 WHERE id = $2', [[s3Url], h.id]);
    } catch (err: any) {
      console.error(`  ❌ Gagal mengunggah ${h.key}:`, err.message);
    }
  }

  // 3. Upload Articles Thumbnail Images
  console.log('\n📰 Mengunggah Thumbnail Warta Berita...');
  const articles = [
    {
      id: '22222222-2222-2222-2222-222222222221',
      key: 'articles/ekowisata-air-panas.jpg',
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      key: 'articles/portal-administrasi-surat.jpg',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: '22222222-2222-2222-2222-222222222223',
      key: 'articles/pendampingan-petani-kakao.jpg',
      url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  for (const a of articles) {
    try {
      const buffer = await downloadBuffer(a.url);
      const s3Url = await uploadToNeonS3(a.key, buffer, 'image/jpeg');
      await pool.query('UPDATE articles SET featured_image_url = $1 WHERE id = $2', [s3Url, a.id]);
    } catch (err: any) {
      console.error(`  ❌ Gagal mengunggah ${a.key}:`, err.message);
    }
  }

  console.log('\n🎉 SELURUH MEDIA BERHASIL DIMIGRASI & TERUPLOAD KE NEON OBJECT STORAGE!');
  await pool.end();
}

runStorageSeeding().catch((err) => {
  console.error('Fatal error seeding storage:', err);
  process.exit(1);
});
