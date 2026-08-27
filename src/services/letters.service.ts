import { pool } from '../config/db';

export const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `MNT-${year}-${randomNum}`;
};

export async function fetchLetterTemplates() {
  const result = await pool.query('SELECT * FROM letter_templates ORDER BY title ASC');
  return result.rows;
}

export async function createLetterRequest(data: any) {
  const { applicant_nik, applicant_name, applicant_phone, applicant_address, letter_type_code, attachment_urls } = data;

  if (!applicant_nik || !applicant_name || !applicant_phone || !applicant_address || !letter_type_code) {
    throw {
      status: 400,
      message: 'NIK, Nama Pemohon, No WhatsApp/HP, Alamat, dan Jenis Surat wajib diisi.',
    };
  }

  if (applicant_nik.length !== 16 || !/^\d+$/.test(applicant_nik)) {
    throw {
      status: 400,
      message: 'NIK harus berupa 16 digit angka.',
    };
  }

  const id = `req-${Date.now()}`;
  const ticket_number = generateTicketNumber();
  const admin_notes = 'Pengajuan surat baru. Menunggu proses verifikasi berkas oleh perangkat desa.';
  const attachments = attachment_urls || [];

  const result = await pool.query(
    `INSERT INTO letter_requests 
     (id, ticket_number, applicant_nik, applicant_name, applicant_phone, applicant_address, letter_type_code, attachment_urls, status, admin_notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [id, ticket_number, applicant_nik, applicant_name, applicant_phone, applicant_address, letter_type_code, attachments, 'PENDING', admin_notes]
  );

  const row = result.rows[0];
  return {
    ticket_number: row.ticket_number,
    status: row.status,
    applicant_name: row.applicant_name,
    letter_type_code: row.letter_type_code,
    created_at: row.created_at,
  };
}

export async function trackLetterByTicket(ticketNumber: string) {
  const result = await pool.query('SELECT * FROM letter_requests WHERE ticket_number = $1', [ticketNumber.trim()]);

  if (result.rows.length === 0) {
    throw {
      status: 404,
      message: 'Nomor Tiket Resi tidak ditemukan. Pastikan Anda memasukkan kode dengan benar (contoh: MNT-2026-08001).',
    };
  }

  return result.rows[0];
}

export async function fetchAdminLetterRequests(status?: string, search?: string) {
  let sql = 'SELECT * FROM letter_requests WHERE 1=1';
  const params: any[] = [];

  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (ticket_number ILIKE $${params.length} OR applicant_name ILIKE $${params.length} OR applicant_nik ILIKE $${params.length})`;
  }

  sql += ' ORDER BY created_at DESC';
  const result = await pool.query(sql, params);
  return result.rows;
}

export async function updateLetterRequestStatus(id: string, status: string, admin_notes?: string) {
  if (!status || !['PENDING', 'PROCESSED', 'COMPLETED', 'REJECTED'].includes(status)) {
    throw { status: 400, message: 'Status tidak valid. Harus PENDING, PROCESSED, COMPLETED, atau REJECTED.' };
  }

  const result = await pool.query(
    'UPDATE letter_requests SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
    [status, admin_notes || null, id]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Pengajuan surat tidak ditemukan.' };
  }

  return result.rows[0];
}
