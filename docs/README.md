# Dokumentasi Backend REST API Website Desa Mantikole

Selamat datang di direktori dokumentasi teknis untuk **Backend REST API Website Desa Mantikole** (Node.js + Express.js + TypeScript + PostgreSQL).

## 📚 Daftar Dokumentasi Riwayat Perubahan

Seluruh dokumentasi disusun berdasarkan tanggal dan judul fitur sesuai perkembangan riwayat commit repository:

| Tanggal | File Dokumentasi | Ringkasan Fitur & Perubahan |
|---|---|---|
| **2026-08-06** | [`2026-08-06-setup-arsitektur-dan-rest-api.md`](./2026-08-06-setup-arsitektur-dan-rest-api.md) | Inisialisasi arsitektur Express.js, TypeScript, PostgreSQL Schema, Seed Data, Auth Middleware, dan REST API routes awal. |
| **2026-08-07** | [`2026-08-07-optimasi-rute-metadata-artikel.md`](./2026-08-07-optimasi-rute-metadata-artikel.md) | Optimasi pencarian artikel warta melalui endpoint `GET /articles/:idOrSlug` berbasis ID maupun Slug. |

---

## 🛠️ Format Standar Dokumentasi

Setiap file dokumen teknis mengikuti struktur baku **WHY, HOW, WHERE, WHAT**:
- **WHY (Mengapa):** Alasan bisnis/teknis di balik penambahan, perubahan, atau penghapusan kode.
- **HOW (Bagaimana):** Pendekatan arsitektur & mekanisme teknis yang diterapkan.
- **WHERE (Di Mana):** Path file persis dan area baris kode yang terdampak.
- **WHAT (Apa):** Cuplikan kode (*snippet diff*) dari perubahan yang dilakukan.
