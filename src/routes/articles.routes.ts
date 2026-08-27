import { Router } from 'express';
import {
  handleGetArticles,
  handleGetArticleDetail,
  handleCreateArticle,
  handleUpdateArticle,
  handleDeleteArticle,
} from '../controllers/articles.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createArticleSchema, updateArticleSchema } from '../validations/article.schema';

const router = Router();

// Public routes
router.get('/', handleGetArticles);
router.get('/:idOrSlug', handleGetArticleDetail);

// Admin routes
router.post('/', requireAuth, validateBody(createArticleSchema), handleCreateArticle);
router.put('/:id', requireAuth, validateBody(updateArticleSchema), handleUpdateArticle);
router.delete('/:id', requireAuth, handleDeleteArticle);

export default router;
