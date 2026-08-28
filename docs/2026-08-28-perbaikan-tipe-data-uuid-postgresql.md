# Perbaikan Tipe Data UUID & Kueri PostgreSQL (2026-08-28)

Dokumen ini mencatat identifikasi dan perbaikan akar masalah (*root cause analysis*) terkait tipe data `UUID` PostgreSQL pada endpoint detail artikel dan permohonan surat warga berlandaskan prinsip **/clean-code-principles** dan **/ponytail**.

---

## 1. Error Operator Type Mismatch pada Artikel (`articles.service.ts`)

### WHY (Mengapa)
Log backend memunculkan error: `operator does not exist: character varying = uuid`.
Hal ini terjadi karena kueri `WHERE a.id = $1 OR a.slug = $1` mencoba membandingkan parameter string slug (tipe `character varying`) dengan kolom `a.id` (tipe `UUID`) tanpa *explicit type casting*.

### HOW (Bagaimana)
- Mengubah kueri perbandingan menjadi `WHERE a.id::text = $1 OR a.slug = $1` sehingga parameter string dapat dicocokkan dengan aman baik sebagai UUID maupun Slug URL.
- Memperbarui kueri `UPDATE` dan `DELETE` pada artikel agar menggunakan klausa `WHERE id::text = $1`.

### WHERE (Di Mana)
- [src/services/articles.service.ts](file:///d:/KKN/Website/backend/src/services/articles.service.ts#L80-L165)

---

## 2. Error Invalid UUID Syntax pada Permohonan Surat (`letters.service.ts`)

### WHY (Mengapa)
Log backend memunculkan error: `invalid input syntax for type uuid: "req-1787883857718"`.
Tabel `letter_requests` memiliki kolom `id` bertipe `UUID` dengan *default* `uuid_generate_v4()`, namun fungsi `createLetterRequest` mencoba memasukkan string prefix kustom (`req-...`).

### HOW (Bagaimana)
- Menghapus pembuatan string `id` manual pada `createLetterRequest` dan membiarkan PostgreSQL menghasilkan UUID native secara otomatis (`DEFAULT`).
- Memperbarui [highlights.service.ts](file:///d:/KKN/Website/backend/src/services/highlights.service.ts) dengan pola yang sama untuk tabel `village_highlights`.

### WHERE (Di Mana)
- [src/services/letters.service.ts](file:///d:/KKN/Website/backend/src/services/letters.service.ts#L36-L41)
- [src/services/highlights.service.ts](file:///d:/KKN/Website/backend/src/services/highlights.service.ts#L66-L70)
