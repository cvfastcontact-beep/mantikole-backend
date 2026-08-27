import { pool } from '../config/db';
import { appCache } from '../utils/cache';

const CACHE_KEY = 'site_settings:all';

export async function fetchSiteSettings() {
  const cached = appCache.get<Record<string, any>>(CACHE_KEY);
  if (cached) return cached;

  const result = await pool.query('SELECT key, value FROM site_settings');
  const settingsObj: Record<string, any> = {};

  result.rows.forEach((r) => {
    try {
      settingsObj[r.key] = JSON.parse(r.value);
    } catch {
      settingsObj[r.key] = r.value;
    }
  });

  appCache.set(CACHE_KEY, settingsObj, 120); // 2 minutes cache
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

  appCache.del(CACHE_KEY);
  return await fetchSiteSettings();
}
