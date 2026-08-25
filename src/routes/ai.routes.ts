import { Router } from 'express';
import { handleAiChat } from '../controllers/ai.controller';

const router = Router();

router.post('/chat', handleAiChat);

export default router;
