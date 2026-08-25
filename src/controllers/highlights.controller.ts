import { Request, Response } from 'express';
import {
  fetchHighlights,
  fetchHighlightDetail,
  createHighlight,
} from '../services/highlights.service';

export async function handleGetHighlights(req: Request, res: Response) {
  try {
    const { type, search } = req.query;
    const highlights = await fetchHighlights(type as string, search as string);
    return res.json({
      success: true,
      data: highlights,
    });
  } catch (error) {
    console.error('Fetch highlights error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data wisata & komoditas.' });
  }
}

export async function handleGetHighlightDetail(req: Request, res: Response) {
  try {
    const item = await fetchHighlightDetail(req.params.slug);
    return res.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Fetch highlight detail error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail wisata/komoditas.' });
  }
}

export async function handleCreateHighlight(req: Request, res: Response) {
  try {
    const newHighlight = await createHighlight(req.body);
    return res.status(201).json({
      success: true,
      message: 'Data wisata/komoditas berhasil ditambahkan.',
      data: newHighlight,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Create highlight error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan wisata/komoditas.' });
  }
}
