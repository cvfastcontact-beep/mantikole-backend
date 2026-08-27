import { Pool } from 'pg';
import dotenv from 'dotenv';
import { memoryStore } from './memoryStore';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    })
  : null;

export { memoryStore };
