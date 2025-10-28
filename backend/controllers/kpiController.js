import { pool } from '../config/db.js';

function parseRange(query){
  const { start_date, end_date, range } = query || {};
  if(start_date && end_date) return { start: start_date, end: end_date };
  // simple range tokens: 30d, 90d, mtd, ytd
  const now = new Date();
  let start;
  if(range === 'mtd'){
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if(range === 'ytd'){
    start = new Date(now.getFullYear(), 0, 1);
  } else if(typeof range === 'string' && /^(\d+)d$/.test(range)){
    const days = parseInt(range.replace('d',''),10) || 30;
    start = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  } else {
    // default to last 30 days
    start = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  }
  const end = now;
  const toISODate = d => d.toISOString().slice(0,10);
  return { start: toISODate(start), end: toISODate(end) };
}

export const getKpis = async (req, res) => {
  try{
    const { start, end } = parseRange(req.query);
    const topN = parseInt(req.query.top_n || '5', 10) || 5;

    // Main KPI aggregation (single-row)
    const mainSql = `
WITH filtered_expenses AS (
  SELECT id, amount::numeric AS amount, LOWER(COALESCE(category,'')) AS category, user_id, trip_id, expense_date::date AS date
  FROM expenses
  WHERE expense_date::date BETWEEN $1 AND $2
    AND (status IS NULL OR status NOT IN ('void','refunded','cancelled'))
),
expense_totals AS (
  SELECT
    COALESCE(SUM(amount),0) AS total_spend,
    COALESCE(SUM(amount) FILTER (WHERE category LIKE '%air%'),0) AS total_airfare,
    COALESCE(SUM(amount) FILTER (WHERE category LIKE '%hotel%' OR category LIKE '%accommodation%'),0) AS total_hotels,
    COALESCE(SUM(amount) FILTER (WHERE category LIKE '%car%' OR category LIKE '%taxi%'),0) AS total_cars,
    COUNT(DISTINCT user_id) AS distinct_travelers
  FROM filtered_expenses
),
trip_times AS (
  SELECT
    COUNT(*) FILTER (WHERE start_date::date BETWEEN $1 AND $2) AS trips_count,
    AVG(EXTRACT(EPOCH FROM (start_date - booking_date))/86400) FILTER (WHERE booking_date IS NOT NULL AND start_date IS NOT NULL) AS avg_booking_lead_days,
    AVG(EXTRACT(EPOCH FROM (approval_date - submitted_date))/3600) FILTER (WHERE approval_date IS NOT NULL AND submitted_date IS NOT NULL) AS avg_approval_hours
  FROM trips
)
SELECT
  et.total_spend,
  et.total_airfare,
  et.total_hotels,
  et.total_cars,
  tt.trips_count,
  COALESCE(tt.avg_booking_lead_days,0) AS avg_booking_lead_days,
  COALESCE(tt.avg_approval_hours,0) AS avg_approval_hours,
  et.distinct_travelers
FROM expense_totals et
CROSS JOIN trip_times tt;
`;

    const topDestSql = `
SELECT COALESCE(t.destination,'Unknown') AS destination, COUNT(*) AS trips, COALESCE(SUM(fe.amount),0) AS spend
FROM trips t
LEFT JOIN expenses fe ON fe.trip_id = t.id AND fe.expense_date::date BETWEEN $1 AND $2
WHERE t.start_date::date BETWEEN $1 AND $2
GROUP BY COALESCE(t.destination,'Unknown')
ORDER BY spend DESC
LIMIT $3;`;

    const mainRes = await pool.query(mainSql, [start, end]);
    const topRes = await pool.query(topDestSql, [start, end, topN]);

    const row = mainRes.rows && mainRes.rows[0] ? mainRes.rows[0] : {};

    const kpis = {
      total_spend: Number(row.total_spend || 0),
      total_airfare: Number(row.total_airfare || 0),
      total_hotels: Number(row.total_hotels || 0),
      total_cars: Number(row.total_cars || 0),
      trips_count: Number(row.trips_count || 0),
      avg_booking_lead_days: Number(row.avg_booking_lead_days || 0),
      avg_approval_hours: Number(row.avg_approval_hours || 0),
      distinct_travelers: Number(row.distinct_travelers || 0),
      spend_per_traveler: (Number(row.total_spend || 0) / Math.max(1, Number(row.distinct_travelers || 0)))
    };

    const top_destinations = (topRes.rows || []).map(r => ({ destination: r.destination, spend: Number(r.spend || 0), trips: Number(r.trips || 0) }));

    return res.json({ success: true, range: { start, end }, kpis, top_destinations });
  }catch(err){
    console.error('kpi error', err);
    return res.status(500).json({ success: false, error: 'Failed to compute KPIs', details: err.message });
  }
};
