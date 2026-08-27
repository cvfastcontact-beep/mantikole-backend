# Peningkatan Fitur CMS Dinamis & Otomasi RAG AI (2026-08-25)

Dokumen ini mencatat pembaruan arsitektur backend untuk mendukung sistem **100% Dynamic Content Management** (pengaturan teks beranda, demografi statistik, CRUD perangkat desa, dan FAQ) serta **otomasi penuh RAG AI Chatbot** yang langsung tersinkronisasi dengan seluruh entitas database secara *real-time*.

---

## 1. Modularisasi Database Configuration & Mock Store Separation (`src/config/db.ts` & `src/config/memoryStore.ts`)

### WHY (Mengapa)
Sebelumnya file `db.ts` berisi konfigurasi koneksi pool PostgreSQL sekaligus 280+ baris data mock *fallback* in-memory. Hal ini melanggar prinsip Single Responsibility Principle (SRP) dan membuat file konfigurasi menjadi membengkak (*godlike file*).

### HOW (Bagaimana)
- Mengekstrak dataset in-memory fallback ke dalam modul terisolasi [memoryStore.ts](file:///d:/KKN/Website/backend/src/config/memoryStore.ts).
- Menyederhanakan [db.ts](file:///d:/KKN/Website/backend/src/config/db.ts) menjadi murni file konfigurasi pool koneksi database PostgreSQL yang ringkas (15 baris).

### WHERE (Di Mana)
- [src/config/memoryStore.ts](file:///d:/KKN/Website/backend/src/config/memoryStore.ts)
- [src/config/db.ts](file:///d:/KKN/Website/backend/src/config/db.ts)
- [src/db/seed.sql](file:///d:/KKN/Website/backend/src/db/seed.sql)

---

## 2. Otomasi RAG AI Tanpa Form Manual Input (`src/services/ai.service.ts`)

### WHY (Mengapa)
Formulir pengisian manual AI Knowledge sebelumnya tidak praktis dan rentan inkonsistensi data. Chatbot asisten digital desa seharusnya secara otomatis mensintesis informasi terbaru dari tabel artikel warta, destinasi wisata, template surat, struktur perangkat desa, FAQ, hingga data statistik kependudukan yang aktif di database.

### HOW (Bagaimana)
- Mengimplementasikan fungsi `buildDynamicRagContext()` pada [ai.service.ts](file:///d:/KKN/Website/backend/src/services/ai.service.ts) yang mengagregasi seluruh dataset live dengan dukungan kueri langsung ke PostgreSQL `pool` saat aktif dan fallback ke `memoryStore`.
- Menambahkan pencocokan maksud (*intent matching*) cerdas untuk pertanyaan seputar demografi penduduk, profil perangkat desa, persyaratan surat, tarif wisata air panas, komoditas kakao, jam buka kantor desa, hingga pencocokan pertanyaan FAQ dinamis.

### WHERE (Di Mana)
- [src/services/ai.service.ts](file:///d:/KKN/Website/backend/src/services/ai.service.ts#L25-L160)
- [src/controllers/ai.controller.ts](file:///d:/KKN/Website/backend/src/controllers/ai.controller.ts#L1-L20)
- [src/routes/ai.routes.ts](file:///d:/KKN/Website/backend/src/routes/ai.routes.ts#L1-L10)

### WHAT (Apa)

```typescript
// src/services/ai.service.ts
async function buildDynamicRagContext() {
  if (pool) {
    // Queries PostgreSQL tables in parallel (site_settings, village_staff, faqs, highlights, articles, templates)
  }
  return { settings, staff, faqs, highlights, articles, templates };
}
```

---

## 3. Layanan Pengaturan Konten Dinamis & Demografi (`src/services/settings.service.ts`)

### WHY (Mengapa)
Seluruh elemen teks hero landing page, slogan, koordinat peta Google Maps, serta angka statistik kependudukan (jumlah penduduk, KK, luas wilayah, jumlah dusun, tonase panen kakao) harus dapat dikelola langsung oleh admin desa melalui CMS tanpa perlu menyentuh kode program.

### HOW (Bagaimana)
- Membuat layer service [settings.service.ts](file:///d:/KKN/Website/backend/src/services/settings.service.ts) dengan dukungan kueri tabel `site_settings` dan fallback `memoryStore.site_settings`.
- Menyediakan endpoint publik `GET /api/v1/settings` dan endpoint admin berproteksi JWT `PUT /api/v1/settings`.

### WHERE (Di Mana)
- [src/services/settings.service.ts](file:///d:/KKN/Website/backend/src/services/settings.service.ts#L1-L45)
- [src/controllers/settings.controller.ts](file:///d:/KKN/Website/backend/src/controllers/settings.controller.ts#L1-L30)
- [src/routes/settings.routes.ts](file:///d:/KKN/Website/backend/src/routes/settings.routes.ts#L1-L12)

---

## 4. Layanan CRUD Struktur Perangkat Desa (`src/services/staff.service.ts`)

### WHY (Mengapa)
Memungkinkan admin desa menambah, mengedit, atau menghapus data aparatur/perangkat desa (nama, jabatan, deskripsi tugas, URL foto, urutan tampil) secara mandiri.

### HOW (Bagaimana)
- Mengembangkan [staff.service.ts](file:///d:/KKN/Website/backend/src/services/staff.service.ts) dengan operasi CRUD lengkap `fetchAllStaff`, `createStaff`, `updateStaff`, dan `deleteStaff`.
- Menyediakan rute `GET /api/v1/staff`, `POST /api/v1/staff`, `PUT /api/v1/staff/:id`, `DELETE /api/v1/staff/:id`.

### WHERE (Di Mana)
- [src/services/staff.service.ts](file:///d:/KKN/Website/backend/src/services/staff.service.ts#L1-L75)
- [src/controllers/staff.controller.ts](file:///d:/KKN/Website/backend/src/controllers/staff.controller.ts#L1-L60)
- [src/routes/staff.routes.ts](file:///d:/KKN/Website/backend/src/routes/staff.routes.ts#L1-L14)

---

## 5. Layanan CRUD FAQ Accordion (`src/services/faq.service.ts`)

### WHY (Mengapa)
Menyediakan modul pengelolaan pertanyaan umum (FAQ) yang langsung tampil di beranda publik dan sekaligus menjadi basis pengetahuan jawaban AI Assistant.

### HOW (Bagaimana)
- Mengembangkan [faq.service.ts](file:///d:/KKN/Website/backend/src/services/faq.service.ts) dengan endpoint `GET /api/v1/faqs`, `POST /api/v1/faqs`, `PUT /api/v1/faqs/:id`, `DELETE /api/v1/faqs/:id`.

### WHERE (Di Mana)
- [src/services/faq.service.ts](file:///d:/KKN/Website/backend/src/services/faq.service.ts#L1-L65)
- [src/controllers/faq.controller.ts](file:///d:/KKN/Website/backend/src/controllers/faq.controller.ts#L1-L55)
- [src/routes/faq.routes.ts](file:///d:/KKN/Website/backend/src/routes/faq.routes.ts#L1-L14)
