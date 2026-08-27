import { Request, Response } from 'express';
import { uploadMediaFile } from '../services/storage.service';

export async function handleUploadMedia(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Tidak ada berkas file yang diunggah.' });
    }

    const folder = (req.body.folder as string) || 'cms';
    const result = await uploadMediaFile(file.buffer, file.originalname, file.mimetype, folder);

    return res.status(201).json({
      success: true,
      message: 'Berkas media berhasil diunggah ke Neon Object Storage.',
      data: result,
    });
  } catch (err: any) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Terjadi kesalahan saat mengunggah berkas.',
    });
  }
}
