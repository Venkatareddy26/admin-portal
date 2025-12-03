import { pool } from '../config/db.js';

export const getExpenses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, trip_id as "tripId", category, vendor, amount, 
        description, expense_date as date
      FROM expenses
      ORDER BY expense_date DESC
      LIMIT 500
    `);
    
    const expenses = result.rows.map(r => ({
      id: r.id,
      tripId: r.tripId,
      category: r.category,
      vendor: r.vendor,
      amount: Number(r.amount) || 0,
      description: r.description,
      date: r.date
    }));
    
    const totalRes = await pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM expenses`);
    const totalExpense = Number(totalRes.rows[0].total) || 0;
    
    return res.json({ success: true, expenses, totalExpense });
  } catch (err) {
    console.error('getExpenses error', err);
    return res.status(500).json({ success: false, error: err.message, expenses: [], totalExpense: 0 });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { tripId, category, vendor, amount, description, date } = req.body;

    const result = await pool.query(`
      INSERT INTO expenses (trip_id, category, vendor, amount, description, expense_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [tripId, category, vendor, amount, description, date]);

    return res.json({ success: true, expense: result.rows[0] });
  } catch (err) {
    console.error('createExpense error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, vendor, amount, description, date } = req.body;

    const result = await pool.query(`
      UPDATE expenses
      SET category = $1, vendor = $2, amount = $3, description = $4, expense_date = $5
      WHERE id = $6
      RETURNING *
    `, [category, vendor, amount, description, date, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    return res.json({ success: true, expense: result.rows[0] });
  } catch (err) {
    console.error('updateExpense error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('deleteExpense error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
