import { pool } from '../config/db';

export async function fetchHighlights(type?: string, search?: string) {
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
  return result.rows;
}

export async function fetchHighlightDetail(slug: string) {
  const result = await pool.query('SELECT * FROM village_highlights WHERE slug = $1', [slug]);

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Data wisata/komoditas tidak ditemukan.' };
  }

  return result.rows[0];
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

  const id = `hl-${Date.now()}`;
  const loc = location_details || 'Desa Mantikole, Dolo Barat, Sigi';
  const lat = latitude || -1.0745;
  const lng = longitude || 119.8322;
  const price = price_info || 'Gratis / Sesuai Layanan';
  const gallery = gallery_urls || ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80'];

  const result = await pool.query(
    `INSERT INTO village_highlights (id, title, slug, type, short_description, full_description, location_details, latitude, longitude, price_info, gallery_urls)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [id, title, slug, type, short_description, full_description, loc, lat, lng, price, gallery]
  );

  return result.rows[0];
}
