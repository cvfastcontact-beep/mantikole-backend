import { Router, Request, Response } from 'express';
import { memoryStore, pool } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/v1/highlights
router.get('/', async (req: Request, res: Response) => {
  const { type, search } = req.query;

  try {
    let highlights: any[] = [];

    if (pool) {
      let query = 'SELECT * FROM village_highlights WHERE 1=1';
      const params: any[] = [];

      if (type) {
        params.push(type);
        query += ` AND type = $${params.length}`;
      }

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (title ILIKE $${params.length} OR short_description ILIKE $${params.length})`;
      }

      query += ' ORDER BY created_at DESC';
      const result = await pool.query(query, params);
      highlights = result.rows;
    } else {
      highlights = [...memoryStore.village_highlights];

      if (type) {
        highlights = highlights.filter((h) => h.type.toLowerCase() === (type as string).toLowerCase());
      }

      if (search) {
        const q = (search as string).toLowerCase();
        highlights = highlights.filter(
          (h) => h.title.toLowerCase().includes(q) || h.short_description.toLowerCase().includes(q)
        );
      }
    }

    return res.json({
      success: true,
      data: highlights,
    });
  } catch (error) {
    console.error('Fetch highlights error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data wisata & komoditas.' });
  }
});

// GET /api/v1/highlights/:slug
router.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    let item: any = null;

    if (pool) {
      const result = await pool.query('SELECT * FROM village_highlights WHERE slug = $1', [slug]);
      if (result.rows.length > 0) {
        item = result.rows[0];
      }
    } else {
      item = memoryStore.village_highlights.find((h) => h.slug === slug);
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Data wisata/komoditas tidak ditemukan.' });
    }

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Fetch highlight detail error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail wisata/komoditas.' });
  }
});

// POST /api/v1/highlights (Auth Required)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { title, type, short_description, full_description, location_details, latitude, longitude, price_info, gallery_urls } = req.body;

  if (!title || !type || !short_description || !full_description) {
    return res.status(400).json({ success: false, message: 'Judul, jenis (type), deskripsi singkat, dan deskripsi lengkap wajib diisi.' });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const newHighlight = {
    id: `hl-${Date.now()}`,
    title,
    slug,
    type,
    short_description,
    full_description,
    location_details: location_details || 'Desa Mantikole, Dolo Barat, Sigi',
    latitude: latitude || -1.0745,
    longitude: longitude || 119.8322,
    price_info: price_info || 'Gratis / Sesuai Layanan',
    gallery_urls: gallery_urls || ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80'],
    created_at: new Date().toISOString(),
  };

  if (pool) {
    await pool.query(
      `INSERT INTO village_highlights (id, title, slug, type, short_description, full_description, location_details, latitude, longitude, price_info, gallery_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        newHighlight.id,
        title,
        slug,
        type,
        short_description,
        full_description,
        newHighlight.location_details,
        newHighlight.latitude,
        newHighlight.longitude,
        newHighlight.price_info,
        newHighlight.gallery_urls,
      ]
    );
  } else {
    memoryStore.village_highlights.unshift(newHighlight);
  }

  return res.status(201).json({
    success: true,
    message: 'Data wisata/komoditas berhasil ditambahkan.',
    data: newHighlight,
  });
});

export default router;
