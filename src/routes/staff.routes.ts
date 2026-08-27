import { Router } from 'express';
import {
  handleGetStaff,
  handleCreateStaff,
  handleUpdateStaff,
  handleDeleteStaff,
} from '../controllers/staff.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createStaffSchema, updateStaffSchema } from '../validations/staff.schema';

const router = Router();

// Public route
router.get('/', handleGetStaff);

// Admin routes
router.post('/', requireAuth, validateBody(createStaffSchema), handleCreateStaff);
router.put('/:id', requireAuth, validateBody(updateStaffSchema), handleUpdateStaff);
router.delete('/:id', requireAuth, handleDeleteStaff);

export default router;
