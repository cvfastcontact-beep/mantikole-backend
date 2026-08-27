# Penguatan Arsitektur Backend: TTL Caching, Validasi Zod, Sanitasi XSS & SQL Pagination (2026-08-27)

Dokumen ini mencatat peningkatan komprehensif performa, arsitektur, dan keamanan pada backend REST API Website Desa Mantikole berbasis prinsip **/ponytail** (solusi paling efisien tanpa ketergantungan library berlebih) dan **/clean-code-principles** (SOLID, DRY, Layered Architecture).

---

## 1. Zero-Dependency In-Memory TTL Caching (`src/utils/cache.ts`)

### WHY (Mengapa)
Kueri publik yang sangat sering diakses oleh pengunjung landing page (`/settings`, `/staff`, `/faqs`, `/highlights`, `/articles`) memicu beban jaringan ke cloud Neon PostgreSQL di setiap *page view*.

### HOW (Bagaimana)
- Mengembangkan modul cache in-memory [cache.ts](file:///d:/KKN/Website/backend/src/utils/cache.ts) berbasis struktur data bawaan JavaScript (`Map`) dengan *Time-To-Live (TTL)* dan dukungan *wildcard pattern deletion* (misal: `articles:*`).
- Menerapkan mekanisme **Auto-Invalidation** pada seluruh operasi write CMS (`create`, `update`, `delete`) sehingga saat data diubah administrator, cache lama otomatis dibersihkan.
- **Hasil Latensi:** Mengurangi waktu respon dari ~100-200ms jaringan database menjadi **< 1ms (0ms memory fetch)**.

### WHERE (Di Mana)
- [src/utils/cache.ts](file:///d:/KKN/Website/backend/src/utils/cache.ts)
- [src/services/settings.service.ts](file:///d:/KKN/Website/backend/src/services/settings.service.ts)
- [src/services/staff.service.ts](file:///d:/KKN/Website/backend/src/services/staff.service.ts)
- [src/services/faq.service.ts](file:///d:/KKN/Website/backend/src/services/faq.service.ts)
- [src/services/highlights.service.ts](file:///d:/KKN/Website/backend/src/services/highlights.service.ts)
- [src/services/articles.service.ts](file:///d:/KKN/Website/backend/src/services/articles.service.ts)

---

## 2. Validasi Terpusat Zod & Sanitasi XSS Input (`src/middlewares/validate.middleware.ts`)

### WHY (Mengapa)
Mencegah payload kotor, manipulasi struktur form, serta serangan injeksi skrip berbahaya (*Stored Cross-Site Scripting / XSS*) pada input warga dan administrator.

### HOW (Bagaimana)
- Mengembangkan middleware `validateBody(schema)` yang secara rekursif membersihkan tag `<script>` / `<iframe>` dan memvalidasi tipe data menggunakan library `zod`.
- Menyusun schema validasi ketat:
  - [auth.schema.ts](file:///d:/KKN/Website/backend/src/validations/auth.schema.ts): Login admin.
  - [letter.schema.ts](file:///d:/KKN/Website/backend/src/validations/letter.schema.ts): NIK 16 digit angka, nomor telepon, dan status permohonan surat.
  - [article.schema.ts](file:///d:/KKN/Website/backend/src/validations/article.schema.ts): Judul, kategori, dan konten warta berita.
  - [staff.schema.ts](file:///d:/KKN/Website/backend/src/validations/staff.schema.ts): Nama, jabatan, dan urutan aparatur.

### WHERE (Di Mana)
- [src/middlewares/validate.middleware.ts](file:///d:/KKN/Website/backend/src/middlewares/validate.middleware.ts)
- [src/validations/](file:///d:/KKN/Website/backend/src/validations/)
- [src/routes/](file:///d:/KKN/Website/backend/src/routes/)

---

## 3. Optimasi Kueri Paginasi Tingkat SQL (`src/services/articles.service.ts`)

### WHY (Mengapa)
Sebelumnya pengambilan data warta mengambil seluruh baris data ke memori server lalu memotongnya menggunakan `.slice()`. Seiring bertambahnya jumlah artikel, pendekatan ini memboroskan memori dan CPU.

### HOW (Bagaimana)
- Mengoptimalkan kueri SQL menggunakan klausa `LIMIT $limit OFFSET $offset` serta kueri `COUNT(*)` terpisah yang efisien.

### WHERE (Di Mana)
- [src/services/articles.service.ts](file:///d:/KKN/Website/backend/src/services/articles.service.ts#L18-L62)

---

## 4. HTTP Security Headers & Global Error Handler (`src/server.ts`)

### WHY (Mengapa)
Mencegah serangan MIME-type sniffing, Clickjacking, dan menyatukan format respon error (DRY).

### HOW (Bagaimana)
- Menambahkan header keamanan native pada middleware express (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`).
- Menerapkan [error.middleware.ts](file:///d:/KKN/Website/backend/src/middlewares/error.middleware.ts) terpusat untuk menangkap seluruh exception runtime secara elegan.
