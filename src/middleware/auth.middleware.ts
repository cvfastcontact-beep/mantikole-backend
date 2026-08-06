import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mantikole_secret_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa.' });
  }
};
