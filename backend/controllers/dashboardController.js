import { pool } from '../config/db.js';

// Cache for dashboard data (5 second TTL)
let dashboardCache = null;
let cacheTime = 0;
const CACHE_TTL = 5000;

export const getDashboardData = async (req, res) => {
  try {
    // Return cached data if fresh
    if (dashboardCache && (Date.now() - cacheTime) < CACHE_TTL) {
      return res.json(dashboardCache);
    }

    // Single combined query for counts
    const countsRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*)::int FROM users) as total_users,
        (SELECT COUNT(*)::int FROM trips) as total_trips,
        (SELECT COALESCE(SUM(amount),0) FROM expenses) as total_expenses,
        (SELECT COUNT(*)::int FROM policies WHERE active = true) as active_policies
    `);

    const counts = countsRes.rows[0];

    // Recent trips query
    const recentTrips = await pool.query(`
      SELECT id, destination, start_date, requested_by 
      FROM trips 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    const recentActivities = recentTrips.rows.map(t => ({ 
      id: `trip-${t.id}`, 
      action: 'Trip scheduled', 
      user: t.requested_by, 
      meta: { destination: t.destination, start: t.start_date } 
    }));

    const response = { 
      success: true, 
      data: { 
        totalUsers: Number(counts.total_users) || 0,
        totalTrips: Number(counts.total_trips) || 0,
        totalExpenses: Number(counts.total_expenses) || 0,
        activePolicies: Number(counts.active_policies) || 0,
        recentActivities 
      } 
    };

    // Cache the response
    dashboardCache = response;
    cacheTime = Date.now();

    return res.json(response);
  } catch (err) {
    console.error('getDashboardData error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
