import { Request, Response } from 'express';
import { fetchSiteSettings, updateSiteSettings } from '../services/settings.service';

export async function handleGetSettings(req: Request, res: Response) {
  try {
    const settings = await fetchSiteSettings();
    return res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan website.' });
  }
}

export async function handleUpdateSettings(req: Request, res: Response) {
  try {
    const updated = await updateSiteSettings(req.body);
    return res.json({
      success: true,
      message: 'Pengaturan website & data statistik berhasil disimpan.',
      data: updated,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan website.' });
  }
}
