import { Request, Response } from 'express';
import { loginUser } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export async function handleLogin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    return res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Login controller error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
}

export function handleGetMe(req: AuthRequest, res: Response) {
  return res.json({
    success: true,
    user: req.user,
  });
}
