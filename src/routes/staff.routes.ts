import { Router } from 'express';
import { handleGetStaff, handleCreateStaff, handleUpdateStaff, handleDeleteStaff } from '../controllers/staff.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', handleGetStaff);
router.post('/', authenticateToken, handleCreateStaff);
router.put('/:id', authenticateToken, handleUpdateStaff);
router.delete('/:id', authenticateToken, handleDeleteStaff);

export default router;
