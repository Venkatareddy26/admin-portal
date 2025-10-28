import { pool } from '../config/db.js';

export const getExpenses = async (req, res) => {
  try {
    const q = `SELECT id, category, amount, expense_date::date AS date, status, user_id, trip_id
               FROM expenses
               ORDER BY expense_date DESC
               LIMIT 100`;
    const result = await pool.query(q).catch(() => ({ rows: [] }));
    const expenses = result.rows || [];
    const totalRes = await pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM expenses`).catch(() => ({ rows: [{ total: 0 }] }));
    const totalExpense = Number((totalRes.rows && totalRes.rows[0] && totalRes.rows[0].total) || 0);
    return res.json({ success: true, expenses, totalExpense });
  } catch (err) {
    console.error('getExpenses error', err);
    return res.json({ success: true, expenses: [], totalExpense: 0 });
  }
};
