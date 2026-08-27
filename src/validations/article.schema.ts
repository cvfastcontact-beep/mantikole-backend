import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(5, 'Judul artikel minimal 5 karakter').max(255),
  content: z.string().min(10, 'Konten artikel minimal 10 karakter'),
  summary: z.string().optional(),
  category: z.string().min(2, 'Kategori warta wajib dipilih'),
  featured_image_url: z.string().optional(),
  is_published: z.boolean().optional().default(true),
});

export const updateArticleSchema = createArticleSchema.partial();
