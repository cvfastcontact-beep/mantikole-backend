import { Router } from 'express';
import { handleGetFaqs, handleCreateFaq, handleUpdateFaq, handleDeleteFaq } from '../controllers/faq.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', handleGetFaqs);
router.post('/', authenticateToken, handleCreateFaq);
router.put('/:id', authenticateToken, handleUpdateFaq);
router.delete('/:id', authenticateToken, handleDeleteFaq);

export default router;
