import { pool } from '../config/db';
import { appCache } from '../utils/cache';

const CACHE_KEY = 'staff:all';

export async function fetchAllStaff() {
  const cached = appCache.get<any[]>(CACHE_KEY);
  if (cached) return cached;

  const result = await pool.query('SELECT * FROM village_staff ORDER BY order_index ASC, created_at ASC');
  const staff = result.rows;

  appCache.set(CACHE_KEY, staff, 120);
  return staff;
}

export async function createStaff(data: any) {
  const { name, role, desc, image_url, order_index } = data;
  if (!name || !role) {
    throw { status: 400, message: 'Nama dan jabatan perangkat desa wajib diisi.' };
  }

  const id = `staff-${Date.now()}`;
  const description = desc || '';
  const image = image_url || '/images/perangkat/kepala_desa.png';
  const order = Number(order_index) || 1;

  const result = await pool.query(
    `INSERT INTO village_staff (id, name, role, description, image_url, order_index)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, name, role, description, image, order]
  );

  appCache.del(CACHE_KEY);
  return result.rows[0];
}

export async function updateStaff(id: string, data: any) {
  const { name, role, desc, image_url, order_index } = data;

  const result = await pool.query(
    `UPDATE village_staff SET 
      name = COALESCE($1, name), 
      role = COALESCE($2, role), 
      description = COALESCE($3, description), 
      image_url = COALESCE($4, image_url), 
      order_index = COALESCE($5, order_index) 
     WHERE id = $6 RETURNING *`,
    [name, role, desc, image_url, order_index, id]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Data perangkat desa tidak ditemukan.' };
  }

  appCache.del(CACHE_KEY);
  return result.rows[0];
}

export async function deleteStaff(id: string) {
  const result = await pool.query('DELETE FROM village_staff WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    throw { status: 404, message: 'Data perangkat desa tidak ditemukan.' };
  }
  appCache.del(CACHE_KEY);
}
