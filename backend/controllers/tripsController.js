import { pool } from '../config/db.js';

export const getTrips = async (req, res) => {
  try {
    const q = `SELECT id, destination, start_date::date AS start_date, status, created_at, requested_by, requester_email
               FROM trips
               ORDER BY start_date DESC
               LIMIT 200`;
    const result = await pool.query(q).catch(() => ({ rows: [] }));
    const trips = (result.rows || []).map(r => ({
      id: r.id,
      destination: r.destination,
      startDate: r.start_date,
      status: r.status || 'unknown',
      requester: r.requester_email || r.requested_by || null,
      createdAt: r.created_at || null
    }));
    return res.json({ success: true, trips });
  } catch (err) {
    console.error('getTrips error', err);
    return res.json({ success: true, trips: [] });
  }
};
