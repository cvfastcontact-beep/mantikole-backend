import { Request, Response } from 'express';
import {
  fetchArticlesQuery,
  fetchArticleDetail,
  createArticle,
  updateArticle,
  deleteArticle,
} from '../services/articles.service';
import { AuthRequest } from '../middleware/auth.middleware';

export async function handleGetArticles(req: Request, res: Response) {
  try {
    const result = await fetchArticlesQuery(req.query);
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Fetch articles error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data artikel.' });
  }
}

export async function handleGetArticleDetail(req: Request, res: Response) {
  try {
    const article = await fetchArticleDetail(req.params.idOrSlug);
    return res.json({
      success: true,
      data: article,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Fetch article detail error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail artikel.' });
  }
}

export async function handleCreateArticle(req: AuthRequest, res: Response) {
  try {
    const newArticle = await createArticle(req.body, {
      id: req.user?.id,
      username: req.user?.username,
    });
    return res.status(201).json({
      success: true,
      message: 'Artikel berhasil dibuat.',
      data: newArticle,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Create article error:', error);
    return res.status(500).json({ success: false, message: 'Gagal membuat artikel.' });
  }
}

export async function handleUpdateArticle(req: AuthRequest, res: Response) {
  try {
    const updated = await updateArticle(req.params.id, req.body);
    return res.json({
      success: true,
      message: 'Artikel berhasil diperbarui.',
      data: updated,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Update article error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengedit artikel.' });
  }
}

export async function handleDeleteArticle(req: AuthRequest, res: Response) {
  try {
    await deleteArticle(req.params.id);
    return res.json({ success: true, message: 'Artikel berhasil dihapus.' });
  } catch (error) {
    console.error('Delete article error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus artikel.' });
  }
}
