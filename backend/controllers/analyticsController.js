import { pool } from '../config/db.js';

export const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, department, region } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (startDate) {
      whereClause += ` AND t.start_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereClause += ` AND t.start_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (department) {
      whereClause += ` AND t.department ILIKE $${paramCount}`;
      params.push(`%${department}%`);
      paramCount++;
    }

    // Get trips with expenses
    const tripsQuery = await pool.query(`
      SELECT 
        t.id, t.destination, t.start_date as date, t.requested_by as employee,
        t.department as dept, t.status, t.cost_estimate as spend,
        COALESCE(SUM(e.amount), t.cost_estimate, 0) as actual_spend
      FROM trips t
      LEFT JOIN expenses e ON e.trip_id = t.id
      ${whereClause}
      GROUP BY t.id, t.destination, t.start_date, t.requested_by, t.department, t.status, t.cost_estimate
      ORDER BY t.start_date DESC
    `, params);

    // Get all expenses
    const expensesQuery = await pool.query(`
      SELECT 
        e.id, e.trip_id as "tripId", e.category, e.vendor, e.amount, e.description
      FROM expenses e
      INNER JOIN trips t ON t.id = e.trip_id
      ${whereClause.replace('t.start_date', 't.start_date')}
    `, params);

    // Get incidents (mock for now, can be added to DB later)
    const incidents = [];

    return res.json({
      success: true,
      trips: tripsQuery.rows,
      expenses: expensesQuery.rows,
      incidents
    });
  } catch (err) {
    console.error('getAnalytics error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};


// Clear all analytics data (trips and expenses)
export const clearAllData = async (req, res) => {
  try {
    // Delete in order due to foreign key constraints (ignore if tables don't exist)
    await pool.query('DELETE FROM trip_comments').catch(() => {});
    await pool.query('DELETE FROM trip_timeline').catch(() => {});
    await pool.query('DELETE FROM trip_attachments').catch(() => {});
    await pool.query('DELETE FROM expenses');
    await pool.query('DELETE FROM trips');
    
    return res.json({
      success: true,
      message: 'All trips and expenses data cleared successfully'
    });
  } catch (err) {
    console.error('clearAllData error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
