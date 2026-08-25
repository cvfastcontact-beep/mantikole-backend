import { Router } from 'express';
import { handleGetSettings, handleUpdateSettings } from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', handleGetSettings);
router.put('/', authenticateToken, handleUpdateSettings);

export default router;
