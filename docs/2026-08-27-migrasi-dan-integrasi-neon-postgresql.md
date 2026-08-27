# Migrasi & Integrasi Database Cloud Neon PostgreSQL (2026-08-27)

Dokumen ini mencatat integrasi dan migrasi penuh database Website Desa Mantikole ke layanan cloud **Neon Lakebase Postgres** (Project: `mantikole-db`, Organisasi: `Manetikole`), menghubungkan CLI, konfigurasi otomatis via `@neon/config`, serta eksekusi skrip migrasi skema tabel dan data awal desa.

---

## 1. Integrasi Workspace Context & Neon CLI

### WHY (Mengapa)
Untuk menjamin persistensi data secara online 24/7 tanpa risiko terhapus atau dinonaktifkan otomatis seperti pada platform database konvensional, proyek dihubungkan ke Neon PostgreSQL serverless berkinerja tinggi.

### HOW (Bagaimana)
- Menautkan workspace context ke organisasi `org-orange-shadow-76600009` dan project `ancient-dawn-70222666` melalui [.neon](file:///d:/KKN/Website/.neon).
- Mengonfigurasi variabel lingkungan koneksi pooler (`DATABASE_URL`) dan direct compute (`DATABASE_URL_UNPOOLED`) ke dalam [backend/.env](file:///d:/KKN/Website/backend/.env) dan [.env.local](file:///d:/KKN/Website/.env.local).
- Membuat deklarasi Infrastructure-as-Code (IaC) pada [neon.ts](file:///d:/KKN/Website/neon.ts) menggunakan `@neon/config`.

### WHERE (Di Mana)
- [.neon](file:///d:/KKN/Website/.neon)
- [neon.ts](file:///d:/KKN/Website/neon.ts)
- [backend/.env](file:///d:/KKN/Website/backend/.env)
- [backend/package.json](file:///d:/KKN/Website/backend/package.json)

---

## 2. Skrip Eksekusi Migrasi & Seeding Otomatis (`src/scripts/migrate.ts`)

### WHY (Mengapa)
Dibutuhkan mekanisme otomatisasi satu perintah (*one-command migration*) untuk membuat seluruh struktur tabel DDL relasional dan mengisikan data awal (*seeding*) resmi desa ke database Neon secara aman.

### HOW (Bagaimana)
- Mengembangkan skrip [migrate.ts](file:///d:/KKN/Website/backend/src/scripts/migrate.ts) yang mengeksekusi `schema.sql` (pembuatan tabel `users`, `site_settings`, `village_staff`, `faqs`, `village_highlights`, `articles`, `letter_templates`, `letter_requests`) dan `seed.sql`.
- Menambahkan perintah `npm run migrate` pada [package.json](file:///d:/KKN/Website/backend/package.json).

### WHERE (Di Mana)
- [src/scripts/migrate.ts](file:///d:/KKN/Website/backend/src/scripts/migrate.ts#L1-L45)
- [package.json](file:///d:/KKN/Website/backend/package.json#L9)

### WHAT (Apa)

```typescript
// backend/src/scripts/migrate.ts
const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
await client.query(schemaSql);

const seedSql = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8');
await client.query(seedSql);
```

---

## 3. Status Tabel yang Berhasil Di-Seed di Neon

| Nama Tabel | Jumlah Data Awal | Keterangan |
|---|---|---|
| `users` | 1 User | Akun Administrator Utama Desa Mantikole (`admin@desamantikole.id`) |
| `site_settings` | 15 Baris | Pengaturan Teks Hero, Slogan, Peta Maps, & 6 Metrik Demografi |
| `village_staff` | 5 Aparatur | Struktur Aparatur Pemerintah Desa Mantikole |
| `faqs` | 5 Pertanyaan | Tanya Jawab Umum Layanan Surat, Wisata, & Operasional Kantor |
| `village_highlights` | 4 Destinasi | Wisata Air Panas Alami, Air Terjun, Perkebunan Kakao, Cengkeh |
| `articles` | 3 Publikasi | Berita Pembangunan & Pelayanan Administrasi Desa |
| `letter_templates` | 3 Template | Template Resmi Permohonan Surat Mandiri (SKU, SKD, SKTM) |
