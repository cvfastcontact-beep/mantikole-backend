import { Router } from 'express';
import {
  handleGetArticles,
  handleGetArticleDetail,
  handleCreateArticle,
  handleUpdateArticle,
  handleDeleteArticle,
} from '../controllers/articles.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', handleGetArticles);
router.get('/:idOrSlug', handleGetArticleDetail);
router.post('/', authenticateToken, handleCreateArticle);
router.put('/:id', authenticateToken, handleUpdateArticle);
router.delete('/:id', authenticateToken, handleDeleteArticle);

export default router;
