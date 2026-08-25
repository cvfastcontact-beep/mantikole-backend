import { Request, Response } from 'express';
import { fetchAllFaqs, createFaq, updateFaq, deleteFaq } from '../services/faq.service';

export async function handleGetFaqs(req: Request, res: Response) {
  try {
    const faqs = await fetchAllFaqs();
    return res.json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error('Fetch FAQs error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data FAQ.' });
  }
}

export async function handleCreateFaq(req: Request, res: Response) {
  try {
    const newFaq = await createFaq(req.body);
    return res.status(201).json({
      success: true,
      message: 'FAQ berhasil ditambahkan.',
      data: newFaq,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Create FAQ error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan FAQ.' });
  }
}

export async function handleUpdateFaq(req: Request, res: Response) {
  try {
    const updated = await updateFaq(req.params.id, req.body);
    return res.json({
      success: true,
      message: 'Data FAQ berhasil diperbarui.',
      data: updated,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Update FAQ error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui FAQ.' });
  }
}

export async function handleDeleteFaq(req: Request, res: Response) {
  try {
    await deleteFaq(req.params.id);
    return res.json({
      success: true,
      message: 'FAQ berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus FAQ.' });
  }
}
