// backend/db.js - Optimized connection pool
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Optimized pool configuration for better performance
export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mva_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  // Connection pool optimization
  max: 20,                    // Maximum connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout for new connections
  allowExitOnIdle: false      // Keep pool alive
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected pool error:', err);
});

// Test connection on startup
(async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL:', res.rows[0].now);
    client.release();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('Check your .env file and PostgreSQL credentials');
    console.error('Expected: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});
