import { pool } from '../config/db.js';

export const getDashboardData = async (req, res) => {
  try {
    const usersRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM users').catch(() => ({ rows: [{ cnt: 0 }] }));
    const tripsRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM trips').catch(() => ({ rows: [{ cnt: 0 }] }));
    const expRes = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM expenses').catch(() => ({ rows: [{ total: 0 }] }));

    const totalUsers = (usersRes.rows && usersRes.rows[0] && Number(usersRes.rows[0].cnt)) || 0;
    const totalTrips = (tripsRes.rows && tripsRes.rows[0] && Number(tripsRes.rows[0].cnt)) || 0;
    const totalExpenses = Number((expRes.rows && expRes.rows[0] && expRes.rows[0].total) || 0);

    // recent activities: attempt to pull recent trips and logins if available
    const recentActivities = [];
    try{
      const recentTrips = await pool.query(`SELECT id, destination, start_date::date AS start_date FROM trips ORDER BY start_date DESC LIMIT 5`).catch(()=>({ rows: [] }));
      for(const t of (recentTrips.rows || [])) recentActivities.push({ id: `trip-${t.id}`, action: 'Trip scheduled', user: null, meta: { destination: t.destination, start: t.start_date } });
    }catch(e){}

    return res.json({ success: true, data: { totalUsers, totalTrips, totalExpenses, activePolicies: 0, recentActivities } });
  } catch (err) {
    console.error('getDashboardData error', err);
    return res.json({ success: true, data: { totalUsers: 0, totalTrips: 0, totalExpenses: 0, activePolicies: 0, recentActivities: [] } });
  }
};
