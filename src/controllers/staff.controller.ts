import { Request, Response } from 'express';
import { fetchAllStaff, createStaff, updateStaff, deleteStaff } from '../services/staff.service';

export async function handleGetStaff(req: Request, res: Response) {
  try {
    const staff = await fetchAllStaff();
    return res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Fetch staff error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data perangkat desa.' });
  }
}

export async function handleCreateStaff(req: Request, res: Response) {
  try {
    const newStaff = await createStaff(req.body);
    return res.status(201).json({
      success: true,
      message: 'Perangkat desa berhasil ditambahkan.',
      data: newStaff,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Create staff error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan perangkat desa.' });
  }
}

export async function handleUpdateStaff(req: Request, res: Response) {
  try {
    const updated = await updateStaff(req.params.id, req.body);
    return res.json({
      success: true,
      message: 'Data perangkat desa berhasil diperbarui.',
      data: updated,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Update staff error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui perangkat desa.' });
  }
}

export async function handleDeleteStaff(req: Request, res: Response) {
  try {
    await deleteStaff(req.params.id);
    return res.json({
      success: true,
      message: 'Perangkat desa berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus perangkat desa.' });
  }
}
