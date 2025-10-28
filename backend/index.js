import express from 'express';
import path from 'path';
import { pool } from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import kpiRoutes from './routes/kpiRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to serve uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Test root route
app.get('/', (req, res) => {
  res.send('🚀 Backend is running!');
});

// Mount user routes
app.use('/api/user', userRoutes);
// Mount KPI routes
app.use('/api/kpi', kpiRoutes);

// Test DB connection
async function testDB() {
  try {
    const res = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Connected to PostgreSQL! Users in table: ${res.rows[0].count}`);
  } catch (err) {
    console.error('❌ DB connection test failed:', err);
  }
}

testDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
