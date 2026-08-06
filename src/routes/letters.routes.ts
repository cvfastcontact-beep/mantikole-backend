import { Router, Request, Response } from 'express';
import { memoryStore, pool } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Helper to generate unique resi ticket number: MNT-2026-XXXXX
const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `MNT-${year}-${randomNum}`;
};

// GET /api/v1/letters/templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    let templates: any[] = [];
    if (pool) {
      const result = await pool.query('SELECT * FROM letter_templates ORDER BY title ASC');
      templates = result.rows;
    } else {
      templates = memoryStore.letter_templates;
    }

    return res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Fetch templates error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar template surat.' });
  }
});

// POST /api/v1/letters/request (Public Citizen Application)
router.post('/request', async (req: Request, res: Response) => {
  const { applicant_nik, applicant_name, applicant_phone, applicant_address, letter_type_code, attachment_urls } = req.body;

  if (!applicant_nik || !applicant_name || !applicant_phone || !applicant_address || !letter_type_code) {
    return res.status(400).json({
      success: false,
      message: 'NIK, Nama Pemohon, No WhatsApp/HP, Alamat, dan Jenis Surat wajib diisi.',
    });
  }

  // Validate NIK length (must be 16 digits)
  if (applicant_nik.length !== 16 || !/^\d+$/.test(applicant_nik)) {
    return res.status(400).json({
      success: false,
      message: 'NIK harus berupa 16 digit angka.',
    });
  }

  const ticket_number = generateTicketNumber();
  const newRequest = {
    id: `req-${Date.now()}`,
    ticket_number,
    applicant_nik,
    applicant_name,
    applicant_phone,
    applicant_address,
    letter_type_code,
    attachment_urls: attachment_urls || [],
    status: 'PENDING',
    admin_notes: 'Pengajuan surat baru. Menunggu proses verifikasi berkas oleh perangkat desa.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    if (pool) {
      await pool.query(
        `INSERT INTO letter_requests 
         (id, ticket_number, applicant_nik, applicant_name, applicant_phone, applicant_address, letter_type_code, attachment_urls, status, admin_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newRequest.id,
          ticket_number,
          applicant_nik,
          applicant_name,
          applicant_phone,
          applicant_address,
          letter_type_code,
          attachment_urls || [],
          'PENDING',
          newRequest.admin_notes,
        ]
      );
    } else {
      memoryStore.letter_requests.unshift(newRequest);
    }

    return res.status(201).json({
      success: true,
      message: 'Pengajuan surat berhasil dikirim!',
      data: {
        ticket_number,
        status: newRequest.status,
        applicant_name,
        letter_type_code,
        created_at: newRequest.created_at,
      },
    });
  } catch (error) {
    console.error('Submit letter request error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengajukan surat.' });
  }
});

// GET /api/v1/letters/track/:ticket_number (Public Tracking)
router.get('/track/:ticket_number', async (req: Request, res: Response) => {
  const { ticket_number } = req.params;

  try {
    let requestItem: any = null;

    if (pool) {
      const result = await pool.query('SELECT * FROM letter_requests WHERE ticket_number = $1', [ticket_number.trim()]);
      if (result.rows.length > 0) {
        requestItem = result.rows[0];
      }
    } else {
      requestItem = memoryStore.letter_requests.find(
        (r) => r.ticket_number.toUpperCase() === ticket_number.trim().toUpperCase()
      );
    }

    if (!requestItem) {
      return res.status(404).json({
        success: false,
        message: 'Nomor Tiket Resi tidak ditemukan. Pastikan Anda memasukkan kode dengan benar (contoh: MNT-2026-08001).',
      });
    }

    return res.json({
      success: true,
      data: requestItem,
    });
  } catch (error) {
    console.error('Track letter error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memlacak status pengajuan surat.' });
  }
});

// GET /api/v1/letters/requests (Auth Required - Admin Bureaucracy Hub)
router.get('/requests', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { status, search } = req.query;

  try {
    let requests: any[] = [];

    if (pool) {
      let query = 'SELECT * FROM letter_requests WHERE 1=1';
      const params: any[] = [];

      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (ticket_number ILIKE $${params.length} OR applicant_name ILIKE $${params.length} OR applicant_nik ILIKE $${params.length})`;
      }

      query += ' ORDER BY created_at DESC';
      const result = await pool.query(query, params);
      requests = result.rows;
    } else {
      requests = [...memoryStore.letter_requests];

      if (status) {
        requests = requests.filter((r) => r.status.toUpperCase() === (status as string).toUpperCase());
      }

      if (search) {
        const q = (search as string).toLowerCase();
        requests = requests.filter(
          (r) =>
            r.ticket_number.toLowerCase().includes(q) ||
            r.applicant_name.toLowerCase().includes(q) ||
            r.applicant_nik.includes(q)
        );
      }
    }

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Fetch admin letter requests error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar pengajuan surat.' });
  }
});

// PATCH /api/v1/letters/requests/:id/status (Auth Required)
router.patch('/requests/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  if (!status || !['PENDING', 'PROCESSED', 'COMPLETED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status tidak valid. Harus PENDING, PROCESSED, COMPLETED, atau REJECTED.' });
  }

  try {
    if (!pool) {
      const index = memoryStore.letter_requests.findIndex((r) => r.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Pengajuan surat tidak ditemukan.' });
      }

      memoryStore.letter_requests[index].status = status;
      if (admin_notes) {
        memoryStore.letter_requests[index].admin_notes = admin_notes;
      }
      memoryStore.letter_requests[index].updated_at = new Date().toISOString();

      return res.json({
        success: true,
        message: `Status pengajuan berhasil diubah menjadi ${status}.`,
        data: memoryStore.letter_requests[index],
      });
    } else {
      const result = await pool.query(
        'UPDATE letter_requests SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [status, admin_notes || null, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Pengajuan surat tidak ditemukan.' });
      }

      return res.json({
        success: true,
        message: `Status pengajuan berhasil diubah menjadi ${status}.`,
        data: result.rows[0],
      });
    }
  } catch (error) {
    console.error('Update letter status error:', error);
    return res.status(500).json({ success: false, message: 'Gagal merubah status pengajuan.' });
  }
});

export default router;
