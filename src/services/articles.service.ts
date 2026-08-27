import { pool } from '../config/db';

export interface FetchArticlesQuery {
  category?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export async function fetchArticlesQuery(query: FetchArticlesQuery) {
  const { category, search, page = '1', limit = '10' } = query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  let sql = 'SELECT a.*, u.full_name as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.is_published = true';
  const params: any[] = [];

  if (category) {
    params.push(category);
    sql += ` AND a.category = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (a.title ILIKE $${params.length} OR a.summary ILIKE $${params.length})`;
  }

  sql += ' ORDER BY a.created_at DESC';
  const result = await pool.query(sql, params);
  const articles = result.rows;

  const total = articles.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedArticles = articles.slice(startIndex, startIndex + limitNum);

  return {
    data: paginatedArticles,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

export async function fetchArticleDetail(idOrSlug: string) {
  const result = await pool.query(
    'SELECT a.*, u.full_name as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.id = $1 OR a.slug = $1 OR a.id ILIKE $2',
    [idOrSlug, `%${idOrSlug}%`]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Artikel tidak ditemukan.' };
  }

  const article = result.rows[0];
  await pool.query('UPDATE articles SET views_count = views_count + 1 WHERE id = $1', [article.id]).catch(() => null);

  return article;
}

export async function createArticle(data: any, author: { id?: string; username?: string }) {
  const { title, content, summary, category, featured_image_url, is_published } = data;

  if (!title || !content || !category) {
    throw { status: 400, message: 'Judul, konten, dan kategori wajib diisi.' };
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const id = `art-${Date.now()}`;
  const computedSummary = summary || content.slice(0, 150) + '...';
  const image = featured_image_url || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80';
  const authorId = author.id || '00000000-0000-0000-0000-000000000001';
  const published = is_published !== undefined ? is_published : true;

  const result = await pool.query(
    `INSERT INTO articles (id, title, slug, content, summary, category, featured_image_url, author_id, is_published)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [id, title, slug, content, computedSummary, category, image, authorId, published]
  );

  return result.rows[0];
}

export async function updateArticle(id: string, data: any) {
  const { title, content, summary, category, featured_image_url, is_published } = data;

  const res = await pool.query(
    `UPDATE articles SET 
      title = COALESCE($1, title),
      content = COALESCE($2, content),
      summary = COALESCE($3, summary),
      category = COALESCE($4, category),
      featured_image_url = COALESCE($5, featured_image_url),
      is_published = COALESCE($6, is_published),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $7 RETURNING *`,
    [title, content, summary, category, featured_image_url, is_published, id]
  );

  if (res.rows.length === 0) {
    throw { status: 404, message: 'Artikel tidak ditemukan.' };
  }

  return res.rows[0];
}

export async function deleteArticle(id: string) {
  const res = await pool.query('DELETE FROM articles WHERE id = $1', [id]);
  if (res.rowCount === 0) {
    throw { status: 404, message: 'Artikel tidak ditemukan.' };
  }
}
