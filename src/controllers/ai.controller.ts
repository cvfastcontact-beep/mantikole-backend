import { Request, Response } from 'express';
import { processAiChat } from '../services/ai.service';

export async function handleAiChat(req: Request, res: Response) {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  try {
    const result = await processAiChat(req.body.message, clientIp);
    return res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('AI Chat controller error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada AI Chat engine.' });
  }
}
