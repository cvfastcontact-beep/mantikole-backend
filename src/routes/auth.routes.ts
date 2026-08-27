import { Router } from 'express';
import { handleLogin } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { loginSchema } from '../validations/auth.schema';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', validateBody(loginSchema), handleLogin);

export default router;
