import { Router } from 'express';
import { handleGetDashboardStats } from '../controllers/admin.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard-stats', authenticateToken, handleGetDashboardStats);

export default router;
