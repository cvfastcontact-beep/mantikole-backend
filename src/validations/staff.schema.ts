import { z } from 'zod';

export const createStaffSchema = z.object({
  name: z.string().min(2, 'Nama perangkat desa minimal 2 karakter').max(150),
  role: z.string().min(2, 'Jabatan wajib diisi').max(100),
  desc: z.string().optional().default(''),
  image_url: z.string().optional(),
  order_index: z.union([z.number(), z.string()]).optional().transform((val) => Number(val) || 1),
});

export const updateStaffSchema = createStaffSchema.partial();
