import { Router } from 'express';
import {
  handleGetLetterTemplates,
  handleCreateLetterRequest,
  handleTrackLetter,
  handleGetAdminLetterRequests,
  handleUpdateLetterStatus,
} from '../controllers/letters.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createLetterRequestSchema, updateLetterStatusSchema } from '../validations/letter.schema';

const router = Router();

// Public routes
router.get('/templates', handleGetLetterTemplates);
router.post('/request', validateBody(createLetterRequestSchema), handleCreateLetterRequest);
router.get('/track/:ticket_number', handleTrackLetter);

// Admin-protected routes
router.get('/requests', requireAuth, handleGetAdminLetterRequests);
router.patch('/request/:id/status', requireAuth, validateBody(updateLetterStatusSchema), handleUpdateLetterStatus);

export default router;
