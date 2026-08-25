import { Router } from 'express';
import { handleLogin, handleGetMe } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', handleLogin);
router.get('/me', authenticateToken, handleGetMe);

export default router;
