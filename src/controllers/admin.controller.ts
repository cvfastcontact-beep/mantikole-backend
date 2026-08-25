import { Request, Response } from 'express';
import { fetchDashboardStats } from '../services/admin.service';

export async function handleGetDashboardStats(req: Request, res: Response) {
  try {
    const stats = await fetchDashboardStats();
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data statistik dashboard.' });
  }
}
