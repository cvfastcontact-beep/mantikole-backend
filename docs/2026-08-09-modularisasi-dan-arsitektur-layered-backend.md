# Modularisasi & Arsitektur Layered Backend (2026-08-09)

Dokumen ini mencatat proses **refactoring arsitektur backend Express.js** ke dalam pola **Layered Architecture (Services → Controllers → Routes)** berbasis prinsip **SOLID (SRP)** dan petunjuk minimalis **Ponytail**.

---

## 1. Pemisahan Layer Layanan Bisnis (`src/services/`)

### WHY (Mengapa)
Sebelumnya logika kueri PostgreSQL, penanganan *memoryStore fallback*, pembuatan nomor resi tiket, verifikasi sandi bcrypt, dan inferensi AI RAG digabungkan langsung di dalam handler rute Express (`routes/*.ts`). Hal ini melanggar Single Responsibility Principle (SRP) dan menyulitkan pengujian serta penggunaan kembali logika bisnis (*reusability*).

### HOW (Bagaimana)
Membuat layer layanan independen di dalam folder `src/services/`:
- [auth.service.ts](file:///d:/KKN/Website/backend/src/services/auth.service.ts): Penanganan otentikasi login admin, verifikasi bcrypt, & pembuatan JWT.
- [articles.service.ts](file:///d:/KKN/Website/backend/src/services/articles.service.ts): Kueri artikel berita, paginasi, pencarian, & inkremen jumlah pembaca.
- [highlights.service.ts](file:///d:/KKN/Website/backend/src/services/highlights.service.ts): Kueri potensi wisata & komoditas perkebunan.
- [letters.service.ts](file:///d:/KKN/Website/backend/src/services/letters.service.ts): Template surat, generator nomor resi tiket `MNT-YYYY-XXXXX`, penjejakan resi publik, & verifikasi admin.
- [ai.service.ts](file:///d:/KKN/Website/backend/src/services/ai.service.ts): Rate limiter IP, filter prompt injection, & generator respon RAG.
- [admin.service.ts](file:///d:/KKN/Website/backend/src/services/admin.service.ts): Perhitungan statistik dashboard & tren surat mingguan.

### WHERE (Di Mana)
- [src/services/auth.service.ts](file:///d:/KKN/Website/backend/src/services/auth.service.ts#L1-L55)
- [src/services/articles.service.ts](file:///d:/KKN/Website/backend/src/services/articles.service.ts#L1-L160)
- [src/services/letters.service.ts](file:///d:/KKN/Website/backend/src/services/letters.service.ts#L1-L160)
- [src/services/ai.service.ts](file:///d:/KKN/Website/backend/src/services/ai.service.ts#L1-L120)
- [src/services/highlights.service.ts](file:///d:/KKN/Website/backend/src/services/highlights.service.ts#L1-L100)
- [src/services/admin.service.ts](file:///d:/KKN/Website/backend/src/services/admin.service.ts#L1-L50)

### WHAT (Apa)

#### Cuplikan `src/services/letters.service.ts`:
```typescript
// src/services/letters.service.ts
export async function createLetterRequest(data: any) {
  const { applicant_nik, applicant_name, applicant_phone, applicant_address, letter_type_code } = data;
  if (!applicant_nik || !applicant_name || !applicant_phone || !applicant_address || !letter_type_code) {
    throw { status: 400, message: 'NIK, Nama, No HP, Alamat, dan Jenis Surat wajib diisi.' };
  }
  const ticket_number = generateTicketNumber();
  // Simpan ke PostgreSQL / MemoryStore fallback...
  return { ticket_number, status: 'PENDING', applicant_name, letter_type_code };
}
```

---

## 2. Pemisahan Layer Pengendali HTTP (`src/controllers/`)

### WHY (Mengapa)
Memisahkan kaitan HTTP Express (seperti `req.body`, `req.params`, `req.query`, pembentukan respon JSON, dan kode status HTTP 200/201/400/404/500) agar terisolasi dari logika bisnis murni.

### HOW (Bagaimana)
Membuat modul pengontrol di `src/controllers/` yang memanggil fungsi layanan dan memformat balasan JSON standar `{ success: true/false, message, data }`:
- [auth.controller.ts](file:///d:/KKN/Website/backend/src/controllers/auth.controller.ts)
- [articles.controller.ts](file:///d:/KKN/Website/backend/src/controllers/articles.controller.ts)
- [highlights.controller.ts](file:///d:/KKN/Website/backend/src/controllers/highlights.controller.ts)
- [letters.controller.ts](file:///d:/KKN/Website/backend/src/controllers/letters.controller.ts)
- [ai.controller.ts](file:///d:/KKN/Website/backend/src/controllers/ai.controller.ts)
- [admin.controller.ts](file:///d:/KKN/Website/backend/src/controllers/admin.controller.ts)

### WHERE (Di Mana)
- [src/controllers/](file:///d:/KKN/Website/backend/src/controllers/)

### WHAT (Apa)

#### Cuplikan `src/controllers/articles.controller.ts`:
```typescript
// src/controllers/articles.controller.ts
export async function handleGetArticles(req: Request, res: Response) {
  try {
    const result = await fetchArticlesQuery(req.query);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Fetch articles error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data artikel.' });
  }
}
```

---

## 3. Pembersihan Layer Rute Deklaratif (`src/routes/`)

### WHY (Mengapa)
Rute API Express seharusnya hanya bertanggung jawab mendaftarkan endpoint rute dan menyematkan middleware autentikasi JWT (`authenticateToken`), tanpa mencampur logika bisnis atau database di dalamnya.

### HOW (Bagaimana)
Merefaktor seluruh file `routes/*.ts` menjadi definisi rute deklaratif satu baris yang menunjuk langsung ke fungsi *controller*.

### WHERE (Di Mana)
- [src/routes/auth.routes.ts](file:///d:/KKN/Website/backend/src/routes/auth.routes.ts#L1-L12)
- [src/routes/articles.routes.ts](file:///d:/KKN/Website/backend/src/routes/articles.routes.ts#L1-L20)
- [src/routes/letters.routes.ts](file:///d:/KKN/Website/backend/src/routes/letters.routes.ts#L1-L20)
- [src/routes/highlights.routes.ts](file:///d:/KKN/Website/backend/src/routes/highlights.routes.ts#L1-L15)
- [src/routes/ai.routes.ts](file:///d:/KKN/Website/backend/src/routes/ai.routes.ts#L1-L15)
- [src/routes/admin.routes.ts](file:///d:/KKN/Website/backend/src/routes/admin.routes.ts#L1-L12)

### WHAT (Apa)

#### Diff Perubahan `src/routes/letters.routes.ts`:
```diff
-router.post('/request', async (req: Request, res: Response) => {
-  const { applicant_nik ... } = req.body;
-  // 70+ baris query database & validasi NIK
-});
+import { handleCreateLetterRequest } from '../controllers/letters.controller';
+router.post('/request', handleCreateLetterRequest);
```
