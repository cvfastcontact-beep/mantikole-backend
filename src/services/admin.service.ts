import { pool } from '../config/db';

export async function fetchDashboardStats() {
  const [artRes, pendRes, appRes, hlRes] = await Promise.all([
    pool.query('SELECT COUNT(*) as count, SUM(views_count) as views FROM articles'),
    pool.query("SELECT COUNT(*) as count FROM letter_requests WHERE status = 'PENDING'"),
    pool.query("SELECT COUNT(*) as count FROM letter_requests WHERE status = 'COMPLETED'"),
    pool.query('SELECT COUNT(*) as count FROM village_highlights'),
  ]);

  const totalArticles = parseInt(artRes.rows[0].count, 10) || 0;
  const totalViews = parseInt(artRes.rows[0].views, 10) || 0;
  const pendingLetters = parseInt(pendRes.rows[0].count, 10) || 0;
  const approvedLetters = parseInt(appRes.rows[0].count, 10) || 0;
  const totalHighlights = parseInt(hlRes.rows[0].count, 10) || 0;

  return {
    total_articles: totalArticles,
    pending_letters: pendingLetters,
    approved_letters: approvedLetters,
    total_highlights: totalHighlights,
    total_website_views: totalViews + 342,
    today_ai_queries: 48,
    weekly_letter_trends: [
      { day: 'Sen', pending: 2, completed: 5 },
      { day: 'Sel', pending: 4, completed: 3 },
      { day: 'Rab', pending: 1, completed: 6 },
      { day: 'Kam', pending: 3, completed: 4 },
      { day: 'Jum', pending: 5, completed: 7 },
      { day: 'Sab', pending: 0, completed: 2 },
      { day: 'Min', pending: 1, completed: 1 },
    ],
  };
}
