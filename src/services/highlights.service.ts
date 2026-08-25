import { memoryStore, pool } from '../config/db';

export async function fetchHighlights(type?: string, search?: string) {
  let highlights: any[] = [];

  if (pool) {
    let sql = 'SELECT * FROM village_highlights WHERE 1=1';
    const params: any[] = [];

    if (type) {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (title ILIKE $${params.length} OR short_description ILIKE $${params.length})`;
    }

    sql += ' ORDER BY created_at DESC';
    const result = await pool.query(sql, params);
    highlights = result.rows;
  } else {
    highlights = [...memoryStore.village_highlights];

    if (type) {
      highlights = highlights.filter((h) => h.type.toLowerCase() === type.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      highlights = highlights.filter(
        (h) => h.title.toLowerCase().includes(q) || h.short_description.toLowerCase().includes(q)
      );
    }
  }

  return highlights;
}

export async function fetchHighlightDetail(slug: string) {
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
    throw { status: 404, message: 'Data wisata/komoditas tidak ditemukan.' };
  }

  return item;
}

export async function createHighlight(data: any) {
  const { title, type, short_description, full_description, location_details, latitude, longitude, price_info, gallery_urls } = data;

  if (!title || !type || !short_description || !full_description) {
    throw { status: 400, message: 'Judul, jenis (type), deskripsi singkat, dan deskripsi lengkap wajib diisi.' };
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

  return newHighlight;
}
