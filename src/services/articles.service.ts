import { memoryStore, pool } from '../config/db';

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

  let articles: any[] = [];

  if (pool) {
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
    articles = result.rows;
  } else {
    articles = memoryStore.articles.filter((a) => a.is_published);

    if (category) {
      articles = articles.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      articles = articles.filter((a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
    }

    articles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

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
  let article: any = null;

  if (pool) {
    const result = await pool.query(
      'SELECT a.*, u.full_name as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.id = $1 OR a.slug = $1 OR a.id ILIKE $2',
      [idOrSlug, `%${idOrSlug}%`]
    );
    if (result.rows.length > 0) {
      article = result.rows[0];
      await pool.query('UPDATE articles SET views_count = views_count + 1 WHERE id = $1', [article.id]).catch(() => null);
    }
  } else {
    article = memoryStore.articles.find((a) => a.id === idOrSlug || a.slug === idOrSlug || a.id.includes(idOrSlug));
  }

  if (!article) {
    throw { status: 404, message: 'Artikel tidak ditemukan.' };
  }

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

  const newArticle = {
    id: `art-${Date.now()}`,
    title,
    slug,
    content,
    summary: summary || content.slice(0, 150) + '...',
    category,
    featured_image_url: featured_image_url || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
    author_id: author.id || '00000000-0000-0000-0000-000000000001',
    author_name: author.username || 'Admin Desa',
    is_published: is_published !== undefined ? is_published : true,
    views_count: 0,
    created_at: new Date().toISOString(),
  };

  if (pool) {
    await pool.query(
      `INSERT INTO articles (id, title, slug, content, summary, category, featured_image_url, author_id, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [newArticle.id, title, slug, content, newArticle.summary, category, newArticle.featured_image_url, newArticle.author_id, newArticle.is_published]
    );
  } else {
    memoryStore.articles.unshift(newArticle);
  }

  return newArticle;
}

export async function updateArticle(id: string, data: any) {
  const { title, content, summary, category, featured_image_url, is_published } = data;

  const index = memoryStore.articles.findIndex((a) => a.id === id);
  if (index === -1 && !pool) {
    throw { status: 404, message: 'Artikel tidak ditemukan.' };
  }

  let updated: any = null;
  if (index !== -1) {
    updated = {
      ...memoryStore.articles[index],
      title: title || memoryStore.articles[index].title,
      content: content || memoryStore.articles[index].content,
      summary: summary || memoryStore.articles[index].summary,
      category: category || memoryStore.articles[index].category,
      featured_image_url: featured_image_url || memoryStore.articles[index].featured_image_url,
      is_published: is_published !== undefined ? is_published : memoryStore.articles[index].is_published,
    };
    memoryStore.articles[index] = updated;
  }

  if (pool) {
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
    if (res.rows.length > 0) {
      updated = res.rows[0];
    }
  }

  return updated || { id };
}

export async function deleteArticle(id: string) {
  memoryStore.articles = memoryStore.articles.filter((a) => a.id !== id);
  if (pool) {
    await pool.query('DELETE FROM articles WHERE id = $1', [id]);
  }
}
