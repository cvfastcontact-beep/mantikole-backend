import { memoryStore, pool } from '../config/db';

export async function fetchAllFaqs() {
  let faqs: any[] = [];

  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM faqs ORDER BY order_index ASC, created_at ASC');
      faqs = result.rows;
    } catch {
      faqs = memoryStore.faqs;
    }
  } else {
    faqs = [...memoryStore.faqs].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }

  return faqs;
}

export async function createFaq(data: any) {
  const { question, answer, category, order_index } = data;
  if (!question || !answer) {
    throw { status: 400, message: 'Pertanyaan dan jawaban FAQ wajib diisi.' };
  }

  const newFaq = {
    id: `faq-${Date.now()}`,
    question,
    answer,
    category: category || 'Umum',
    order_index: Number(order_index) || memoryStore.faqs.length + 1,
    created_at: new Date().toISOString(),
  };

  if (pool) {
    await pool.query(
      `INSERT INTO faqs (id, question, answer, category, order_index)
       VALUES ($1, $2, $3, $4, $5)`,
      [newFaq.id, newFaq.question, newFaq.answer, newFaq.category, newFaq.order_index]
    ).catch(() => null);
  }

  memoryStore.faqs.push(newFaq);
  return newFaq;
}

export async function updateFaq(id: string, data: any) {
  const { question, answer, category, order_index } = data;
  const index = memoryStore.faqs.findIndex((f) => f.id === id);

  if (index === -1) {
    throw { status: 404, message: 'Data FAQ tidak ditemukan.' };
  }

  const updated = {
    ...memoryStore.faqs[index],
    question: question || memoryStore.faqs[index].question,
    answer: answer || memoryStore.faqs[index].answer,
    category: category || memoryStore.faqs[index].category,
    order_index: order_index !== undefined ? Number(order_index) : memoryStore.faqs[index].order_index,
  };

  memoryStore.faqs[index] = updated;

  if (pool) {
    await pool.query(
      `UPDATE faqs SET question = $1, answer = $2, category = $3, order_index = $4 WHERE id = $5`,
      [updated.question, updated.answer, updated.category, updated.order_index, id]
    ).catch(() => null);
  }

  return updated;
}

export async function deleteFaq(id: string) {
  memoryStore.faqs = memoryStore.faqs.filter((f) => f.id !== id);
  if (pool) {
    await pool.query('DELETE FROM faqs WHERE id = $1', [id]).catch(() => null);
  }
}
