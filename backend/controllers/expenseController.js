import { pool } from '../config/db.js';

// Cache for expenses (10 second TTL)
let expenseCache = { data: null, time: 0 };
const EXPENSE_CACHE_TTL = 10000;

export const getExpenses = async (req, res) => {
  try {
    // Return cached data if fresh
    if (expenseCache.data && (Date.now() - expenseCache.time) < EXPENSE_CACHE_TTL) {
      return res.json(expenseCache.data);
    }

    // Single combined query for expenses and total
    const result = await pool.query(`
      SELECT 
        id, trip_id as "tripId", category, vendor, amount, 
        description, expense_date as date,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses) as total_expense
      FROM expenses
      ORDER BY expense_date DESC
      LIMIT 500
    `);
    
    const totalExpense = result.rows.length > 0 ? Number(result.rows[0].total_expense) || 0 : 0;
    
    const expenses = result.rows.map(r => ({
      id: r.id,
      tripId: r.tripId,
      category: r.category,
      vendor: r.vendor,
      amount: Number(r.amount) || 0,
      description: r.description,
      date: r.date
    }));
    
    const response = { success: true, expenses, totalExpense };
    
    // Cache the response
    expenseCache = { data: response, time: Date.now() };
    
    return res.json(response);
  } catch (err) {
    console.error('getExpenses error', err);
    return res.status(500).json({ success: false, error: err.message, expenses: [], totalExpense: 0 });
  }
};

// Invalidate cache on mutations
function invalidateExpenseCache() {
  expenseCache = { data: null, time: 0 };
}

export const createExpense = async (req, res) => {
  try {
    const { tripId, category, vendor, amount, description, date } = req.body;

    const result = await pool.query(`
      INSERT INTO expenses (trip_id, category, vendor, amount, description, expense_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [tripId, category, vendor, amount, description, date]);

    invalidateExpenseCache(); // Clear cache on create
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

    invalidateExpenseCache(); // Clear cache on update
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

    invalidateExpenseCache(); // Clear cache on delete
    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('deleteExpense error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
