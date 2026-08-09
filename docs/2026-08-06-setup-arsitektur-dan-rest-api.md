# Setup Arsitektur & REST API Backend Desa Mantikole (2026-08-06)

Dokumen ini mencatat inisialisasi awal proyek **Backend REST API Website Desa Mantikole** berbasis Express.js, TypeScript, PostgreSQL, dan JWT Authentication.

---

## 1. Setup Server Express.js & Konfigurasi TypeScript

### WHY (Mengapa)
Membutuhkan pondasi server backend yang aman, cepat, dan bertipe kuat (type-safe) untuk melayani kebutuhan frontend Next.js dalam menangani permohonan surat warga, berita desa, sorotan beranda, dan pengiriman data ke AI Chatbot.

### HOW (Bagaimana)
- Menggunakan Express.js dengan middleware `cors`, `dotenv`, `express.json()`, dan `express.urlencoded()`.
- Mengatur penanganan rute versi API `/api/v1/`.
- Menyediakan fallback *Memory Store* jika koneksi database PostgreSQL belum dikonfigurasi.

### WHERE (Di Mana)
- [src/server.ts](file:///d:/KKN/Website/backend/src/server.ts#L1-L55)
- [package.json](file:///d:/KKN/Website/backend/package.json#L1-L30)

### WHAT (Apa)
```typescript
// src/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import articlesRoutes from './routes/articles.routes';
import highlightsRoutes from './routes/highlights.routes';
import lettersRoutes from './routes/letters.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/articles', articlesRoutes);
app.use('/api/v1/highlights', highlightsRoutes);
app.use('/api/v1/letters', lettersRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Express Backend Server berjalan pada http://localhost:${PORT}`);
});
```

---

## 2. Schema Database PostgreSQL & Seed Data

### WHY (Mengapa)
Memerlukan struktur tabel relasional yang memadai untuk menyimpan data pengguna (admin), artikel berita, pengajuan surat warga (dengan status verifikasi & resi), serta basis fakta untuk AI RAG.

### HOW (Bagaimana)
- Membuat file SQL DDL [`schema.sql`](file:///d:/KKN/Website/backend/src/db/schema.sql) yang mendefinisikan tabel `users`, `articles`, `letter_templates`, `letter_requests`, `highlights`, dan `ai_knowledge`.
- Menggunakan ekstensi `pgcrypto` untuk pembuatan UUID otomatis (`gen_random_uuid()`).
- Menyiapkan file data awal [`seed.sql`](file:///d:/KKN/Website/backend/src/db/seed.sql) dengan data sampel berita desa, template surat SKU/SKD/SKTM, dan kredensial admin default (`admin` / `admin123`).

### WHERE (Di Mana)
- [src/db/schema.sql](file:///d:/KKN/Website/backend/src/db/schema.sql#L1-L95)
- [src/db/seed.sql](file:///d:/KKN/Website/backend/src/db/seed.sql#L1-L156)

### WHAT (Apa)
```sql
-- src/db/schema.sql (Cuplikan Tabel Utama)
CREATE TABLE IF NOT EXISTS letter_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    applicant_nik VARCHAR(16) NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50) NOT NULL,
    applicant_address TEXT NOT NULL,
    letter_type_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Middleware Autentikasi JWT

### WHY (Mengapa)
Melindungi rute-rute sensitif (seperti pembuatan/penghapusan berita & verifikasi status surat) agar hanya bisa diakses oleh admin perangkat desa yang memiliki token JWT valid.

### HOW (Bagaimana)
Mengekstrak header `Authorization: Bearer <token>`, memverifikasinya menggunakan `jsonwebtoken`, lalu meneruskan data `user` ke penanganan rute berikutnya.

### WHERE (Di Mana)
- [src/middleware/auth.middleware.ts](file:///d:/KKN/Website/backend/src/middleware/auth.middleware.ts#L1-L29)

### WHAT (Apa)
```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mantikole_secret_key');
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kadaluwarsa.' });
  }
};
```

---

## 4. Endpoints Layanan Surat Mandiri (`/letters`)

### WHY (Mengapa)
Warga butuh mengajukan surat tanpa login, namun tetap bisa mengecek status verifikasi secara mandiri menggunakan nomor resi unik.

### HOW (Bagaimana)
- Menggenerasi kode tiket unik berformat `MNT-YYYY-XXXXX` saat pengajuan diajukan via `POST /api/v1/letters/request`.
- Menyediakan endpoint publik `GET /api/v1/letters/track/:ticketNumber` untuk pelacakan status resi.
- Menyediakan endpoint admin `PATCH /api/v1/letters/requests/:id/status` untuk memperbarui status (`PENDING`, `PROCESSED`, `COMPLETED`, `REJECTED`).

### WHERE (Di Mana)
- [src/routes/letters.routes.ts](file:///d:/KKN/Website/backend/src/routes/letters.routes.ts#L1-L246)

### WHAT (Apa)
```typescript
// src/routes/letters.routes.ts
router.post('/request', async (req: Request, res: Response) => {
  const { applicant_nik, applicant_name, applicant_phone, applicant_address, letter_type_code } = req.body;
  const ticketNumber = `MNT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  // Simpan ke PostgreSQL / fallback MemoryStore
  // Return ticket_number ke pengguna
});
```
