import { Request, Response } from 'express';
import {
  fetchLetterTemplates,
  createLetterRequest,
  trackLetterByTicket,
  fetchAdminLetterRequests,
  updateLetterRequestStatus,
} from '../services/letters.service';

export async function handleGetLetterTemplates(req: Request, res: Response) {
  try {
    const templates = await fetchLetterTemplates();
    return res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Fetch templates error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar template surat.' });
  }
}

export async function handleCreateLetterRequest(req: Request, res: Response) {
  try {
    const result = await createLetterRequest(req.body);
    return res.status(201).json({
      success: true,
      message: 'Pengajuan surat berhasil dikirim!',
      data: result,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Submit letter request error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengajukan surat.' });
  }
}

export async function handleTrackLetter(req: Request, res: Response) {
  try {
    const requestItem = await trackLetterByTicket(req.params.ticket_number);
    return res.json({
      success: true,
      data: requestItem,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Track letter error:', error);
    return res.status(500).json({ success: false, message: 'Gagal melacak status pengajuan surat.' });
  }
}

export async function handleGetAdminLetterRequests(req: Request, res: Response) {
  try {
    const { status, search } = req.query;
    const requests = await fetchAdminLetterRequests(status as string, search as string);
    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Fetch admin letter requests error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar pengajuan surat.' });
  }
}

export async function handleUpdateLetterStatus(req: Request, res: Response) {
  try {
    const { status, admin_notes } = req.body;
    const updated = await updateLetterRequestStatus(req.params.id, status, admin_notes);
    return res.json({
      success: true,
      message: `Status pengajuan berhasil diubah menjadi ${status}.`,
      data: updated,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Update letter status error:', error);
    return res.status(500).json({ success: false, message: 'Gagal merubah status pengajuan.' });
  }
}
