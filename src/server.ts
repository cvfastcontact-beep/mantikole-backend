import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth.routes';
import articlesRoutes from './routes/articles.routes';
import highlightsRoutes from './routes/highlights.routes';
import lettersRoutes from './routes/letters.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';
import settingsRoutes from './routes/settings.routes';
import staffRoutes from './routes/staff.routes';
import faqRoutes from './routes/faq.routes';
import uploadRoutes from './routes/upload.routes';
import { globalErrorHandler } from './middlewares/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers Middleware (Native Standard without extra bloat)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Enable CORS for frontend connection
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve local uploads folder if fallback is used
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Root Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Website Desa Mantikole API',
    status: 'Operational',
    version: '1.3.0',
    timestamp: new Date().toISOString(),
  });
});

// API V1 Endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/articles', articlesRoutes);
app.use('/api/v1/highlights', highlightsRoutes);
app.use('/api/v1/letters', lettersRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/faqs', faqRoutes);
app.use('/api/v1/upload', uploadRoutes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Endpoint REST API tidak ditemukan.' });
});

// Centralized Global Error Handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Express Backend Server Website Desa Mantikole berjalan pada http://localhost:${PORT}`);
});
