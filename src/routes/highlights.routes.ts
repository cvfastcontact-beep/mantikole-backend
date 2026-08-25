import { Router } from 'express';
import {
  handleGetHighlights,
  handleGetHighlightDetail,
  handleCreateHighlight,
} from '../controllers/highlights.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', handleGetHighlights);
router.get('/:slug', handleGetHighlightDetail);
router.post('/', authenticateToken, handleCreateHighlight);

export default router;
