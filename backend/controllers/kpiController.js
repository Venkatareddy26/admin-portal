import { pool } from '../config/db.js';

// Cache for KPI data (5 second TTL per range)
const kpiCache = {};
const CACHE_TTL = 5000;

export const getKPIs = async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Return cached data if fresh
    if (kpiCache[range] && (Date.now() - kpiCache[range].time) < CACHE_TTL) {
      return res.json(kpiCache[range].data);
    }
    
    // Calculate date range
    let daysBack = 30;
    if (range === '7d') daysBack = 7;
    else if (range === '90d') daysBack = 90;
    else if (range === '365d') daysBack = 365;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Single combined query for all KPIs
    const result = await pool.query(`
      SELECT 
        -- Expense metrics
        COALESCE((SELECT SUM(CASE WHEN LOWER(category) LIKE '%air%' OR LOWER(category) LIKE '%flight%' THEN amount ELSE 0 END) FROM expenses WHERE expense_date >= $1), 0) as total_airfare,
        COALESCE((SELECT SUM(CASE WHEN LOWER(category) LIKE '%hotel%' OR LOWER(category) LIKE '%accommodation%' THEN amount ELSE 0 END) FROM expenses WHERE expense_date >= $1), 0) as total_hotels,
        COALESCE((SELECT SUM(CASE WHEN LOWER(category) LIKE '%car%' OR LOWER(category) LIKE '%rental%' OR LOWER(category) LIKE '%taxi%' THEN amount ELSE 0 END) FROM expenses WHERE expense_date >= $1), 0) as total_cars,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date >= $1), 0) as total_spend,
        COALESCE((SELECT COUNT(*) FROM expenses WHERE expense_date >= $1 AND (LOWER(category) LIKE '%air%' OR LOWER(category) LIKE '%flight%')), 0) as flights_count,
        COALESCE((SELECT COUNT(*) FROM expenses WHERE expense_date >= $1 AND LOWER(category) LIKE '%hotel%'), 0) as hotels_count,
        COALESCE((SELECT COUNT(*) FROM expenses WHERE expense_date >= $1 AND LOWER(category) LIKE '%car%'), 0) as cars_count,
        -- Trip metrics
        COALESCE((SELECT COUNT(*) FROM trips WHERE created_at >= $1), 0) as trips_count,
        COALESCE((SELECT COUNT(DISTINCT requester_email) FROM trips WHERE created_at >= $1), 0) as distinct_travelers,
        COALESCE((SELECT COUNT(DISTINCT destination) FROM trips WHERE created_at >= $1), 0) as destinations_count,
        COALESCE((SELECT AVG(start_date::date - created_at::date) FROM trips WHERE created_at >= $1 AND start_date IS NOT NULL), 0) as avg_booking_lead_days
    `, [startDateStr]);

    const r = result.rows[0];

    const kpis = {
      total_airfare: Number(r.total_airfare) || 0,
      total_hotels: Number(r.total_hotels) || 0,
      total_cars: Number(r.total_cars) || 0,
      total_spend: Number(r.total_spend) || 0,
      trips_count: Number(r.trips_count) || 0,
      distinct_travelers: Number(r.distinct_travelers) || 0,
      destinations_count: Number(r.destinations_count) || 0,
      avg_booking_lead_days: Number(r.avg_booking_lead_days) || 0,
      flights_count: Number(r.flights_count) || 0,
      hotels_count: Number(r.hotels_count) || 0,
      cars_count: Number(r.cars_count) || 0,
      hotel_nights: Number(r.hotels_count) * 2 || 0,
      car_days: Number(r.cars_count) * 3 || 0,
    };

    const response = { success: true, kpis };
    
    // Cache the response
    kpiCache[range] = { data: response, time: Date.now() };

    return res.json(response);
  } catch (err) {
    console.error('getKPIs error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
