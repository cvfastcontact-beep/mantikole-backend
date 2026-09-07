# Integrasi Google Gemini LLM & Dynamic Key Resolver (2026-09-04)

Dokumen ini mencatat integrasi penuh **Google Gemini 2.5 Flash (`gemini-2.5-flash`)** dan **Gemini Embedding (`gemini-embedding-001`, 768 dimensi)** dengan mekanisme *Dynamic Environment Resolver*, *Fallback Resilience*, dan pengindeksan vektor ke **Neon pgvector** berlandaskan prinsip **Clean Code** & **Ponytail**.

---

## 📌 Rincian Implementasi Berdasarkan 4 Pilar Dokumentasi

### 1. WHY (Mengapa)
- **Model Generasi AI Mutakhir:** Menggunakan model **Gemini 2.5 Flash** yang memiliki pemahaman penalaran tinggi, format Markdown rapi, dan latensi sangat rendah.
- **Dukungan Vektor Native 768 Dimensi:** Menggunakan `gemini-embedding-001` dengan `outputDimensionality: 768` yang kompatibel langsung dengan skema database PostgreSQL `vector(768)`.
- **Dynamic Key Resolver & Full Resilience:** API key dibaca secara dinamis saat runtime, lengkap dengan sistem fallback offline jika kuota/koneksi terputus.

---

### 2. HOW (Bagaimana)
- **Konfigurasi Environment `.env`:**
  ```env
  GEMINI_API_KEY=AQ.Ab8RN...
  GEMINI_MODEL=gemini-2.5-flash
  DATABASE_URL="...neondb?sslmode=verify-full"
  DATABASE_URL_UNPOOLED="...neondb?sslmode=verify-full"
  ```
- **Alur RAG (Retrieval-Augmented Generation):**
  1. Pengguna mengajukan pertanyaan di frontend chatbot.
  2. [embedding.service.ts](file:///d:/KKN/Website/backend/src/services/embedding.service.ts) mencari Top-4 dokumen paling relevan di Neon pgvector menggunakan *Cosine Distance*.
  3. [ai.service.ts](file:///d:/KKN/Website/backend/src/services/ai.service.ts) menyuntikkan dokumen konteks resmi desa ke dalam prompt Google Gemini LLM dengan instruksi kesantunan lokal Sulawesi Tengah ("*Tabe!*").
  4. Menghasilkan jawaban yang ringkas, akurat, terstruktur dalam format Markdown, dan mencantumkan sumber dokumen desa.

---

### 3. WHERE (Di Mana)

| File | Tipe | Deskripsi |
| :--- | :--- | :--- |
| [backend/.env](file:///d:/KKN/Website/backend/.env) | `MODIFY` | Model `gemini-2.5-flash` dan `sslmode=verify-full` |
| [backend/src/services/ai.service.ts](file:///d:/KKN/Website/backend/src/services/ai.service.ts) | `MODIFY` | Dynamic key resolver, model Gemini 2.5, logging lengkap, prompt RAG desa, dan fallback |
| [backend/src/services/embedding.service.ts](file:///d:/KKN/Website/backend/src/services/embedding.service.ts) | `MODIFY` | Integrasi `gemini-embedding-001` (768 dim), helper `syncAllKnowledgeVectors()`, dan HNSW cosine search |
| [backend/src/scripts/seed-vectors.ts](file:///d:/KKN/Website/backend/src/scripts/seed-vectors.ts) | `MODIFY` | Script inisialisasi / seeding seluruh vektor data desa ke database Neon |

---

## 🧪 Hasil Pengujian Langsung

```
🤖 [AI Engine] 📩 Menerima Pertanyaan User: "Berapa tiket air panas Mantikole dan apa saja fasilitasnya?" (IP: 127.0.0.1)
🔍 [AI Engine] Melakukan Semantic Search di Neon pgvector...
📚 [AI Engine] Ditemukan 4 dokumen relevan:
   1. "Pemandian Air Panas Alami Mantikole" (Score: 89.7%)
   2. "Profil Umum & Geografis Desa Mantikole" (Score: 64.9%)
   3. "Pelayanan Kantor Desa & Pengajuan Surat" (Score: 64.8%)
   4. "Panduan Permohonan Surat Keterangan Usaha (SKU) (SKU)" (Score: 2.6%)
🔑 [AI Engine] Menggunakan Gemini API Key: AQ.Ab8...ZiMA | Model: gemini-2.5-flash
🚀 [AI Engine] Mengirim prompt ke Google Gemini API...
✅ [AI Engine] Sukses mendapatkan respon dari Google Gemini (632 karakter).
```
