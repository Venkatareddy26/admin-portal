import { pool } from '../config/db.js';

export const getTrips = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, destination, start_date, end_date, status, 
        requested_by, requester_email, department, purpose, 
        cost_estimate, risk_level, created_at
      FROM trips
      ORDER BY created_at DESC
      LIMIT 500
    `);
    
    const trips = result.rows.map(r => ({
      id: r.id,
      destination: r.destination,
      start: r.start_date,
      end: r.end_date,
      status: r.status,
      requester: r.requested_by,
      requesterEmail: r.requester_email,
      department: r.department,
      purpose: r.purpose,
      costEstimate: Number(r.cost_estimate) || 0,
      riskLevel: r.risk_level,
      createdAt: r.created_at,
      timeline: [],
      comments: [],
      attachments: []
    }));
    
    return res.json({ success: true, trips });
  } catch (err) {
    console.error('getTrips error', err);
    return res.status(500).json({ success: false, error: err.message, trips: [] });
  }
};

export const createTrip = async (req, res) => {
  try {
    const { 
      destination, start, end, requester, requesterEmail, 
      department, purpose, costEstimate, riskLevel 
    } = req.body;

    const result = await pool.query(`
      INSERT INTO trips (
        destination, start_date, end_date, requested_by, requester_email,
        department, purpose, cost_estimate, risk_level, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `, [destination, start, end, requester, requesterEmail, department, purpose, costEstimate, riskLevel]);

    return res.json({ success: true, trip: result.rows[0] });
  } catch (err) {
    console.error('createTrip error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(`
      UPDATE trips 
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    return res.json({ success: true, trip: result.rows[0] });
  } catch (err) {
    console.error('updateTrip error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM trips WHERE id = $1', [id]);

    return res.json({ success: true });
  } catch (err) {
    console.error('deleteTrip error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
