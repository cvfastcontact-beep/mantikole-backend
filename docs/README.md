# Dokumentasi Backend REST API Website Desa Mantikole

Selamat datang di direktori dokumentasi teknis untuk **Backend REST API Website Desa Mantikole** (Node.js + Express.js + TypeScript + Neon Lakebase Postgres + pgvector + Neon Object Storage).

## 📚 Daftar Dokumentasi Riwayat Perubahan

Seluruh dokumentasi disusun berdasarkan tanggal dan judul fitur sesuai perkembangan riwayat commit repository:

| Tanggal | File Dokumentasi | Ringkasan Fitur & Perubahan |
|---|---|---|
| **2026-08-06** | [`2026-08-06-setup-arsitektur-dan-rest-api.md`](./2026-08-06-setup-arsitektur-dan-rest-api.md) | Inisialisasi arsitektur Express.js, TypeScript, PostgreSQL Schema, Seed Data, Auth Middleware, dan REST API routes awal. |
| **2026-08-07** | [`2026-08-07-optimasi-rute-metadata-artikel.md`](./2026-08-07-optimasi-rute-metadata-artikel.md) | Optimasi pencarian artikel warta melalui endpoint `GET /articles/:idOrSlug` berbasis ID maupun Slug. |
| **2026-08-09** | [`2026-08-09-modularisasi-dan-arsitektur-layered-backend.md`](./2026-08-09-modularisasi-dan-arsitektur-layered-backend.md) | Refactoring arsitektur ke dalam Layered Architecture (Services → Controllers → Routes) berprinsip SOLID-SRP. |
| **2026-08-25** | [`2026-08-25-fitur-cms-dinamis-dan-otomasi-rag-ai.md`](./2026-08-25-fitur-cms-dinamis-dan-otomasi-rag-ai.md) | Endpoint settings, staff, dan faqs untuk CMS 100% dinamis serta otomasi penuh context RAG AI langsung dari live database. |
| **2026-08-27** | [`2026-08-27-migrasi-dan-integrasi-neon-postgresql.md`](./2026-08-27-migrasi-dan-integrasi-neon-postgresql.md) | Integrasi penuh Neon Lakebase Postgres (IaC neon.ts, CLI linkage, automated migration & live seeding). |
| **2026-08-27** | [`2026-08-27-integrasi-neon-object-storage.md`](./2026-08-27-integrasi-neon-object-storage.md) | Integrasi Neon Object Storage (Bucket `mantikole-media`), REST API upload endpoint, dan komponen `ImageUploader` di CMS. |
| **2026-08-27** | [`2026-08-27-penguatan-arsitektur-caching-dan-keamanan-zod.md`](./2026-08-27-penguatan-arsitektur-caching-dan-keamanan-zod.md) | In-memory TTL Caching (<1ms latency), Auto-Invalidation, Validasi Zod terpusat, Sanitasi XSS, dan SQL Paginasi. |
| **2026-08-28** | [`2026-08-28-integrasi-pgvector-rag-dan-embedding-semantic-search.md`](./2026-08-28-integrasi-pgvector-rag-dan-embedding-semantic-search.md) | Native `pgvector` Semantic Search (HNSW index, Cosine Distance), auto-sync CMS hooks, dan Google Gemini RAG. |
| **2026-08-28** | [`2026-08-28-perbaikan-tipe-data-uuid-postgresql.md`](./2026-08-28-perbaikan-tipe-data-uuid-postgresql.md) | Perbaikan casting eksplisit `id::text` pada slug artikel dan otomasi UUID PostgreSQL pada tabel pengajuan surat warga. |
| **2026-09-04** | [`2026-09-04-setup-integrasi-llm-gemini-dan-env.md`](./2026-09-04-setup-integrasi-llm-gemini-dan-env.md) | Integrasi penuh Google Gemini LLM & text-embedding-004 dengan Dynamic Key Resolver dan fallback resilience. |


---

## 🛠️ Format Standar Dokumentasi

Setiap file dokumen teknis mengikuti struktur baku **WHY, HOW, WHERE, WHAT**:
- **WHY (Mengapa):** Alasan bisnis/teknis di balik penambahan, perubahan, atau penghapusan kode.
- **HOW (Bagaimana):** Pendekatan arsitektur & mekanisme teknis yang diterapkan.
- **WHERE (Di Mana):** Path file persis dan area baris kode yang terdampak.
- **WHAT (Apa):** Cuplikan kode (*snippet diff*) dari perubahan yang dilakukan.
