// backend/db.js
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mva_db',
  password: 'Arya@9262', // change this
  port: 5432,
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Database connection error:', err);
  }
})();
