import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import articlesRoutes from './routes/articles.routes';
import highlightsRoutes from './routes/highlights.routes';
import lettersRoutes from './routes/letters.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Root Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Website Desa Mantikole API',
    status: 'Operational',
    version: '1.0.0',
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

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Endpoint REST API tidak ditemukan.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Express Backend Server Website Desa Mantikole berjalan pada http://localhost:${PORT}`);
});
