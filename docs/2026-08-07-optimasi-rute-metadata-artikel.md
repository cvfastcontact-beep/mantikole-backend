# Optimasi Rute Metadata Artikel (2026-08-07)

Dokumen ini mencatat perubahan pada endpoint artikel warta backend untuk mendukung kueri fleksibel berbasis ID maupun Slug artikel.

---

## 1. Fleksibilitas Kueri Detail Artikel (`GET /api/v1/articles/:idOrSlug`)

### WHY (Mengapa)
Sebelumnya endpoint artikel detail hanya menerima parameter `:slug` (`GET /api/v1/articles/:slug`). Namun pada frontend Next.js App Router, routing halaman menggunakan dinamis ID `[id]` (seperti `/berita/art-1`), yang menyebabkan kegagalan pembacaan detail artikel jika artikel diakses menggunakan ID alih-alih Slug string.

### HOW (Bagaimana)
- Mengubah parameter rute dari `:slug` menjadi `:idOrSlug`.
- Memperbarui SQL query PostgreSQL untuk mencocokkan `a.id = $1 OR a.slug = $1 OR a.id ILIKE $2`.
- Menyelimuti kueri penambahan `views_count` dengan `.catch(() => null)` agar kegagalan peningkatan view tidak membatalkan respon data artikel.

### WHERE (Di Mana)
- [src/routes/articles.routes.ts](file:///d:/KKN/Website/backend/src/routes/articles.routes.ts#L68-L88)

### WHAT (Apa)

#### Diff Perubahan:
```diff
-// GET /api/v1/articles/:slug
-router.get('/:slug', async (req: Request, res: Response) => {
-  const { slug } = req.params;
+// GET /api/v1/articles/:idOrSlug
+router.get('/:idOrSlug', async (req: Request, res: Response) => {
+  const { idOrSlug } = req.params;

   try {
     let article: any = null;

     if (pool) {
       const result = await pool.query(
-        'SELECT a.*, u.full_name as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.slug = $1',
-        [slug]
+        'SELECT a.*, u.full_name as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.id = $1 OR a.slug = $1 OR a.id ILIKE $2',
+        [idOrSlug, `%${idOrSlug}%`]
       );
       if (result.rows.length > 0) {
         article = result.rows[0];
-        // Increment views count
-        await pool.query('UPDATE articles SET views_count = views_count + 1 WHERE id = $1', [article.id]);
+        await pool.query('UPDATE articles SET views_count = views_count + 1 WHERE id = $1', [article.id]).catch(() => null);
       }
     } else {
-      article = memoryStore.articles.find((a) => a.slug === slug);
-      if (article) {
-        article.views_count += 1;
-      }
+      article = memoryStore.articles.find((a) => a.id === idOrSlug || a.slug === idOrSlug || a.id.includes(idOrSlug));
     }
```
