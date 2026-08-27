import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  message: string;
  errors?: any;
}

export function globalErrorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  const message = err.message || 'Terjadi kesalahan pada server internal.';

  if (status >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(status).json({
    success: false,
    message,
    ...(err.errors ? { errors: err.errors } : {}),
  });
}
