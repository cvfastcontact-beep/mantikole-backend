import { memoryStore, pool } from '../config/db';

export const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `MNT-${year}-${randomNum}`;
};

export async function fetchLetterTemplates() {
  let templates: any[] = [];
  if (pool) {
    const result = await pool.query('SELECT * FROM letter_templates ORDER BY title ASC');
    templates = result.rows;
  } else {
    templates = memoryStore.letter_templates;
  }
  return templates;
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

  return {
    ticket_number,
    status: newRequest.status,
    applicant_name,
    letter_type_code,
    created_at: newRequest.created_at,
  };
}

export async function trackLetterByTicket(ticketNumber: string) {
  let requestItem: any = null;

  if (pool) {
    const result = await pool.query('SELECT * FROM letter_requests WHERE ticket_number = $1', [ticketNumber.trim()]);
    if (result.rows.length > 0) {
      requestItem = result.rows[0];
    }
  } else {
    requestItem = memoryStore.letter_requests.find(
      (r) => r.ticket_number.toUpperCase() === ticketNumber.trim().toUpperCase()
    );
  }

  if (!requestItem) {
    throw {
      status: 404,
      message: 'Nomor Tiket Resi tidak ditemukan. Pastikan Anda memasukkan kode dengan benar (contoh: MNT-2026-08001).',
    };
  }

  return requestItem;
}

export async function fetchAdminLetterRequests(status?: string, search?: string) {
  let requests: any[] = [];

  if (pool) {
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
    requests = result.rows;
  } else {
    requests = [...memoryStore.letter_requests];

    if (status) {
      requests = requests.filter((r) => r.status.toUpperCase() === status.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      requests = requests.filter(
        (r) =>
          r.ticket_number.toLowerCase().includes(q) ||
          r.applicant_name.toLowerCase().includes(q) ||
          r.applicant_nik.includes(q)
      );
    }
  }

  return requests;
}

export async function updateLetterRequestStatus(id: string, status: string, admin_notes?: string) {
  if (!status || !['PENDING', 'PROCESSED', 'COMPLETED', 'REJECTED'].includes(status)) {
    throw { status: 400, message: 'Status tidak valid. Harus PENDING, PROCESSED, COMPLETED, atau REJECTED.' };
  }

  if (!pool) {
    const index = memoryStore.letter_requests.findIndex((r) => r.id === id);
    if (index === -1) {
      throw { status: 404, message: 'Pengajuan surat tidak ditemukan.' };
    }

    memoryStore.letter_requests[index].status = status;
    if (admin_notes) {
      memoryStore.letter_requests[index].admin_notes = admin_notes;
    }
    memoryStore.letter_requests[index].updated_at = new Date().toISOString();

    return memoryStore.letter_requests[index];
  } else {
    const result = await pool.query(
      'UPDATE letter_requests SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, admin_notes || null, id]
    );

    if (result.rows.length === 0) {
      throw { status: 404, message: 'Pengajuan surat tidak ditemukan.' };
    }

    return result.rows[0];
  }
}
