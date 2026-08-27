import { pool } from '../config/db';

export async function fetchAllFaqs() {
  const result = await pool.query('SELECT * FROM faqs ORDER BY order_index ASC, created_at ASC');
  return result.rows;
}

export async function createFaq(data: any) {
  const { question, answer, category, order_index } = data;
  if (!question || !answer) {
    throw { status: 400, message: 'Pertanyaan dan jawaban FAQ wajib diisi.' };
  }

  const id = `faq-${Date.now()}`;
  const cat = category || 'Umum';
  const order = Number(order_index) || 1;

  const result = await pool.query(
    `INSERT INTO faqs (id, question, answer, category, order_index)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id, question, answer, cat, order]
  );

  return result.rows[0];
}

export async function updateFaq(id: string, data: any) {
  const { question, answer, category, order_index } = data;

  const result = await pool.query(
    `UPDATE faqs SET 
      question = COALESCE($1, question), 
      answer = COALESCE($2, answer), 
      category = COALESCE($3, category), 
      order_index = COALESCE($4, order_index) 
     WHERE id = $5 RETURNING *`,
    [question, answer, category, order_index, id]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Data FAQ tidak ditemukan.' };
  }

  return result.rows[0];
}

export async function deleteFaq(id: string) {
  const result = await pool.query('DELETE FROM faqs WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    throw { status: 404, message: 'Data FAQ tidak ditemukan.' };
  }
}
