# Integrasi Neon Object Storage untuk Media & CMS (2026-08-27)

Dokumen ini mencatat konfigurasi dan integrasi **Neon Object Storage (S3-compatible)** untuk penyimpanan aset gambar, dokumen, dan berkas media pada Website Desa Mantikole, mencakup CMS Admin (Warta Berita, Wisata & Komoditas, Foto Perangkat Desa) dengan public CDN endpoint yang tersinkronisasi per branch.

---

## 1. Deklarasi Bucket Infrastructure-as-Code (`neon.ts`)

### WHY (Mengapa)
Untuk menyimpan berkas gambar yang diunggah oleh administrator secara persisten dan terisolasi per branch tanpa perlu menggunakan vendor storage terpisah (seperti AWS S3 mandiri atau Cloudflare R2).

### HOW (Bagaimana)
- Mendeklarasikan bucket `mantikole-media` dengan mode akses `public_read` pada [neon.ts](file:///d:/KKN/Website/neon.ts).
- Menjalankan `neon deploy` untuk memprovisi bucket secara otomatis pada branch `production`.
- Mengonfigurasi variabel lingkungan `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, dan `NEON_STORAGE_BUCKET` di [backend/.env](file:///d:/KKN/Website/backend/.env).

### WHERE (Di Mana)
- [neon.ts](file:///d:/KKN/Website/neon.ts#L6-L8)
- [backend/.env](file:///d:/KKN/Website/backend/.env#L10-L14)

---

## 2. Storage Service & REST API Upload Endpoint

### WHY (Mengapa)
Menyediakan layer abstraction terpusat untuk memproses upload multipart/form-data dan mengirimkannya ke endpoint S3 Neon menggunakan `@aws-sdk/client-s3`.

### HOW (Bagaimana)
- Mengembangkan [storage.service.ts](file:///d:/KKN/Website/backend/src/services/storage.service.ts) dengan konfigurasi `forcePathStyle: true` (standar Neon Object Storage) dan caching headers `Cache-Control: public, max-age=31536000, immutable`.
- Membuat controller [upload.controller.ts](file:///d:/KKN/Website/backend/src/controllers/upload.controller.ts) dan rute [upload.routes.ts](file:///d:/KKN/Website/backend/src/routes/upload.routes.ts) dengan `multer` memory storage.
- Mendaftarkan rute `POST /api/v1/upload` pada [server.ts](file:///d:/KKN/Website/backend/src/server.ts) (API Version 1.2.0).

### WHERE (Di Mana)
- [backend/src/services/storage.service.ts](file:///d:/KKN/Website/backend/src/services/storage.service.ts)
- [backend/src/controllers/upload.controller.ts](file:///d:/KKN/Website/backend/src/controllers/upload.controller.ts)
- [backend/src/routes/upload.routes.ts](file:///d:/KKN/Website/backend/src/routes/upload.routes.ts)
- [backend/src/server.ts](file:///d:/KKN/Website/backend/src/server.ts#L54)

---

## 3. Komponen Frontend Reusable `ImageUploader.tsx` & Seeding S3

### WHY (Mengapa)
Memberikan pengalaman antarmuka yang modern, cepat, dan intuitif bagi admin desa untuk memilih file gambar dari perangkat lokal, melihat pratinjau thumbnail instan, menghapus, atau memasukkan URL manual.

### HOW (Bagaimana)
- Membuat komponen [ImageUploader.tsx](file:///d:/KKN/Website/frontend/src/components/admin/ImageUploader.tsx) dengan feedback status loading spinner, error validation (format dan ukuran berkas maks 10MB), dan thumbnail preview.
- Mengeksekusi [seed-storage.ts](file:///d:/KKN/Website/backend/src/scripts/seed-storage.ts) untuk mengunggah seluruh 5 foto perangkat desa, 4 foto destinasi/komoditas, dan 3 thumbnail warta ke bucket `mantikole-media`.
- Mengintegrasikan komponen ke dalam:
  1. [AdminArticlesManager.tsx](file:///d:/KKN/Website/frontend/src/components/admin/AdminArticlesManager.tsx) (Thumbnail Warta Berita)
  2. [AdminWisataManager.tsx](file:///d:/KKN/Website/frontend/src/components/admin/AdminWisataManager.tsx) (Foto Destinasi Wisata & Komoditas)
  3. [AdminStaffManager.tsx](file:///d:/KKN/Website/frontend/src/components/admin/AdminStaffManager.tsx) (Foto Profil Perangkat Desa)
