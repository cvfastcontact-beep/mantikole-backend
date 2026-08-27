import { pool } from '../config/db';

export async function fetchSiteSettings() {
  const result = await pool.query('SELECT key, value FROM site_settings');
  const settingsObj: Record<string, any> = {};

  result.rows.forEach((r) => {
    try {
      settingsObj[r.key] = JSON.parse(r.value);
    } catch {
      settingsObj[r.key] = r.value;
    }
  });

  return settingsObj;
}

export async function updateSiteSettings(newSettings: Record<string, any>) {
  for (const [key, value] of Object.entries(newSettings)) {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await pool.query(
      `INSERT INTO site_settings (key, value, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, stringValue]
    );
  }

  return await fetchSiteSettings();
}
