// backend/db.js
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mva_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Database connection error:', err);
    console.error('Check your .env file and PostgreSQL credentials');
  }
})();
