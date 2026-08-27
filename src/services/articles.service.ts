import { pool } from '../config/db';
import { appCache } from '../utils/cache';

export interface FetchArticlesQuery {
  category?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export async function fetchArticlesQuery(query: FetchArticlesQuery) {
  const { category, search, page = '1', limit = '10' } = query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const cacheKey = `articles:list:${category || 'all'}:${search || ''}:${pageNum}:${limitNum}`;
  const cached = appCache.get<any>(cacheKey);
  if (cached) return cached;

  let whereClauses = ['a.is_published = true'];
  const params: any[] = [];

  if (category && category !== 'ALL') {
    params.push(category);
    whereClauses.push(`a.category = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(a.title ILIKE $${params.length} OR a.summary ILIKE $${params.length} OR a.content ILIKE $${params.length})`);
  }

  const whereSql = whereClauses.join(' AND ');

  // Count query
  const countRes = await pool.query(
    `SELECT COUNT(*) as total FROM articles a WHERE ${whereSql}`,
    params
  );
  const total = parseInt(countRes.rows[0].total, 10) || 0;

  // Paginated data query
  params.push(limitNum);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const dataSql = `
    SELECT a.*, u.full_name as author_name 
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id 
    WHERE ${whereSql} 
    ORDER BY a.created_at DESC 
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const result = await pool.query(dataSql, params);

  const response = {
    data: result.rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };

  appCache.set(cacheKey, response, 60); // 60s cache
  return response;
}

export async function fetchArticleDetail(idOrSlug: string) {
  const cacheKey = `articles:detail:${idOrSlug}`;
  const cached = appCache.get<any>(cacheKey);
  if (cached) return cached;

  const result = await pool.query(
    'SELECT a.*, u.full_name as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.id = $1 OR a.slug = $1 OR a.id ILIKE $2',
    [idOrSlug, `%${idOrSlug}%`]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Artikel tidak ditemukan.' };
  }

  const article = result.rows[0];
  await pool.query('UPDATE articles SET views_count = views_count + 1 WHERE id = $1', [article.id]).catch(() => null);

  appCache.set(cacheKey, article, 60);
  return article;
}

export async function createArticle(data: any, author: { id?: string; username?: string }) {
  const { title, content, summary, category, featured_image_url, is_published } = data;

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const id = `art-${Date.now()}`;
  const computedSummary = summary || content.slice(0, 150) + '...';
  const image = featured_image_url || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80';
  const authorId = author.id || '00000000-0000-0000-0000-000000000001';
  const published = is_published !== undefined ? is_published : true;

  const result = await pool.query(
    `INSERT INTO articles (id, title, slug, content, summary, category, featured_image_url, author_id, is_published)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [id, title, slug, content, computedSummary, category, image, authorId, published]
  );

  appCache.del('articles:*');
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

  appCache.del('articles:*');
  return res.rows[0];
}

export async function deleteArticle(id: string) {
  const res = await pool.query('DELETE FROM articles WHERE id = $1', [id]);
  if (res.rowCount === 0) {
    throw { status: 404, message: 'Artikel tidak ditemukan.' };
  }
  appCache.del('articles:*');
}
