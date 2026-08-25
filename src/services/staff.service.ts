import { memoryStore, pool } from '../config/db';

export async function fetchAllStaff() {
  let staffList: any[] = [];

  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM village_staff ORDER BY order_index ASC, created_at ASC');
      staffList = result.rows;
    } catch {
      staffList = memoryStore.village_staff;
    }
  } else {
    staffList = [...memoryStore.village_staff].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }

  return staffList;
}

export async function createStaff(data: any) {
  const { name, role, desc, image_url, order_index } = data;
  if (!name || !role) {
    throw { status: 400, message: 'Nama dan jabatan perangkat desa wajib diisi.' };
  }

  const newStaff = {
    id: `staff-${Date.now()}`,
    name,
    role,
    desc: desc || '',
    image_url: image_url || '/images/perangkat/kepala_desa.png',
    order_index: Number(order_index) || memoryStore.village_staff.length + 1,
    created_at: new Date().toISOString(),
  };

  if (pool) {
    await pool.query(
      `INSERT INTO village_staff (id, name, role, description, image_url, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newStaff.id, newStaff.name, newStaff.role, newStaff.desc, newStaff.image_url, newStaff.order_index]
    ).catch(() => null);
  }

  memoryStore.village_staff.push(newStaff);
  return newStaff;
}

export async function updateStaff(id: string, data: any) {
  const { name, role, desc, image_url, order_index } = data;
  const index = memoryStore.village_staff.findIndex((s) => s.id === id);

  if (index === -1) {
    throw { status: 404, message: 'Data perangkat desa tidak ditemukan.' };
  }

  const updated = {
    ...memoryStore.village_staff[index],
    name: name || memoryStore.village_staff[index].name,
    role: role || memoryStore.village_staff[index].role,
    desc: desc !== undefined ? desc : memoryStore.village_staff[index].desc,
    image_url: image_url || memoryStore.village_staff[index].image_url,
    order_index: order_index !== undefined ? Number(order_index) : memoryStore.village_staff[index].order_index,
  };

  memoryStore.village_staff[index] = updated;

  if (pool) {
    await pool.query(
      `UPDATE village_staff SET name = $1, role = $2, description = $3, image_url = $4, order_index = $5 WHERE id = $6`,
      [updated.name, updated.role, updated.desc, updated.image_url, updated.order_index, id]
    ).catch(() => null);
  }

  return updated;
}

export async function deleteStaff(id: string) {
  memoryStore.village_staff = memoryStore.village_staff.filter((s) => s.id !== id);
  if (pool) {
    await pool.query('DELETE FROM village_staff WHERE id = $1', [id]).catch(() => null);
  }
}
