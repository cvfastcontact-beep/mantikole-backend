import { memoryStore, pool } from '../config/db';

export async function fetchSiteSettings() {
  if (pool) {
    try {
      const result = await pool.query('SELECT key, value FROM site_settings');
      if (result.rows.length > 0) {
        const settingsObj: Record<string, any> = {};
        result.rows.forEach((r) => {
          try {
            settingsObj[r.key] = JSON.parse(r.value);
          } catch {
            settingsObj[r.key] = r.value;
          }
        });
        return { ...memoryStore.site_settings, ...settingsObj };
      }
    } catch {
      // fallback to memoryStore
    }
  }
  return memoryStore.site_settings;
}

export async function updateSiteSettings(newSettings: Record<string, any>) {
  memoryStore.site_settings = {
    ...memoryStore.site_settings,
    ...newSettings,
  };

  if (pool) {
    for (const [key, value] of Object.entries(newSettings)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await pool.query(
        `INSERT INTO site_settings (key, value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, stringValue]
      ).catch(() => null);
    }
  }

  return memoryStore.site_settings;
}
