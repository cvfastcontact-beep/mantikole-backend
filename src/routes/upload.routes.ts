import { Router } from 'express';
import multer from 'multer';
import { handleUploadMedia } from '../controllers/upload.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

const router = Router();

// POST /api/v1/upload
router.post('/', upload.single('file'), handleUploadMedia);

export default router;
