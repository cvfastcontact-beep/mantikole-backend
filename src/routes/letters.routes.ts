import { Router } from 'express';
import {
  handleGetLetterTemplates,
  handleCreateLetterRequest,
  handleTrackLetter,
  handleGetAdminLetterRequests,
  handleUpdateLetterStatus,
} from '../controllers/letters.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/templates', handleGetLetterTemplates);
router.post('/request', handleCreateLetterRequest);
router.get('/track/:ticket_number', handleTrackLetter);
router.get('/requests', authenticateToken, handleGetAdminLetterRequests);
router.patch('/requests/:id/status', authenticateToken, handleUpdateLetterStatus);

export default router;
