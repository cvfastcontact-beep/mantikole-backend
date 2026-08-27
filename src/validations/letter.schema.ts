import { z } from 'zod';

export const createLetterRequestSchema = z.object({
  applicant_nik: z
    .string()
    .length(16, 'NIK harus tepat 16 digit')
    .regex(/^\d+$/, 'NIK hanya boleh berisi angka'),
  applicant_name: z.string().min(2, 'Nama pemohon minimal 2 karakter').max(150),
  applicant_phone: z.string().min(8, 'Nomor HP/WhatsApp minimal 8 digit').max(20),
  applicant_address: z.string().min(5, 'Alamat lengkap wajib diisi'),
  letter_type_code: z.string().min(2, 'Kode jenis surat wajib dipilih'),
  attachment_urls: z.array(z.string()).optional().default([]),
});

export const updateLetterStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSED', 'COMPLETED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status harus PENDING, PROCESSED, COMPLETED, atau REJECTED' }),
  }),
  admin_notes: z.string().optional(),
});
