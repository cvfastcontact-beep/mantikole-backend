import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'mantikole_secret_key_2026';

export async function loginUser(username: string, password: string) {
  if (!username || !password) {
    throw { status: 400, message: 'Username dan password wajib diisi.' };
  }

  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];

  if (!user) {
    throw { status: 401, message: 'Username atau password salah.' };
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw { status: 401, message: 'Username atau password salah.' };
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.full_name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      email: user.email,
    },
  };
}
