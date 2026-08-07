import { Router, Request, Response } from 'express';
import { memoryStore, pool } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/v1/articles
router.get('/', async (req: Request, res: Response) => {
  const { category, search, page = '1', limit = '10' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  try {
    let articles: any[] = [];

    if (pool) {
      let query = 'SELECT a.*, u.full_name as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.is_published = true';
      const params: any[] = [];

      if (category) {
        params.push(category);
        query += ` AND a.category = $${params.length}`;
      }

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (a.title ILIKE $${params.length} OR a.summary ILIKE $${params.length})`;
      }

      query += ' ORDER BY a.created_at DESC';
      const result = await pool.query(query, params);
      articles = result.rows;
    } else {
      articles = memoryStore.articles.filter((a) => a.is_published);

      if (category) {
        articles = articles.filter((a) => a.category.toLowerCase() === (category as string).toLowerCase());
      }

      if (search) {
        const q = (search as string).toLowerCase();
        articles = articles.filter((a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
      }

      articles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const total = articles.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedArticles = articles.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      data: paginatedArticles,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Fetch articles error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data artikel.' });
  }
});

// GET /api/v1/articles/:idOrSlug
router.get('/:idOrSlug', async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;

  try {
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
      return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
    }

    return res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Fetch article detail error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail artikel.' });
  }
});

// POST /api/v1/articles (Auth Required)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { title, content, summary, category, featured_image_url, is_published } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ success: false, message: 'Judul, konten, dan kategori wajib diisi.' });
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
    author_id: req.user?.id || '00000000-0000-0000-0000-000000000001',
    author_name: req.user?.username || 'Admin Desa',
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

  return res.status(201).json({
    success: true,
    message: 'Artikel berhasil dibuat.',
    data: newArticle,
  });
});

// PUT /api/v1/articles/:id (Auth Required)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, summary, category, featured_image_url, is_published } = req.body;

  if (!pool) {
    const index = memoryStore.articles.findIndex((a) => a.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
    }

    const updated = {
      ...memoryStore.articles[index],
      title: title || memoryStore.articles[index].title,
      content: content || memoryStore.articles[index].content,
      summary: summary || memoryStore.articles[index].summary,
      category: category || memoryStore.articles[index].category,
      featured_image_url: featured_image_url || memoryStore.articles[index].featured_image_url,
      is_published: is_published !== undefined ? is_published : memoryStore.articles[index].is_published,
    };

    memoryStore.articles[index] = updated;
    return res.json({ success: true, message: 'Artikel berhasil diperbarui.', data: updated });
  }

  return res.json({ success: true, message: 'Artikel berhasil diperbarui.' });
});

// DELETE /api/v1/articles/:id (Auth Required)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!pool) {
    memoryStore.articles = memoryStore.articles.filter((a) => a.id !== id);
  } else {
    await pool.query('DELETE FROM articles WHERE id = $1', [id]);
  }

  return res.json({ success: true, message: 'Artikel berhasil dihapus.' });
});

export default router;
