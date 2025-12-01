import { pool } from '../config/db.js';

// Get all risk advisories
export const getAdvisories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, destination, title, type, severity, description, created_at as "createdAt"
      FROM risk_advisories
      ORDER BY created_at DESC
      LIMIT 100
    `);

    return res.json({
      success: true,
      advisories: result.rows
    });
  } catch (err) {
    console.error('getAdvisories error', err);
    return res.status(500).json({ success: false, error: err.message, advisories: [] });
  }
};

// Create new advisory
export const createAdvisory = async (req, res) => {
  try {
    const { destination, title, type, severity, description } = req.body;

    const result = await pool.query(`
      INSERT INTO risk_advisories (destination, title, type, severity, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [destination, title, type, severity, description]);

    return res.json({
      success: true,
      advisory: result.rows[0]
    });
  } catch (err) {
    console.error('createAdvisory error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Get traveler locations
export const getTravelers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, location, opt_in as "optIn", 
             last_check_in as "lastCheckIn", sos_active as "sosActive"
      FROM traveler_safety
      ORDER BY last_check_in DESC
    `);

    return res.json({
      success: true,
      travelers: result.rows
    });
  } catch (err) {
    console.error('getTravelers error', err);
    return res.status(500).json({ success: false, error: err.message, travelers: [] });
  }
};

// Update traveler check-in
export const checkIn = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE traveler_safety
      SET last_check_in = NOW(), sos_active = false
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Traveler not found' });
    }

    return res.json({
      success: true,
      traveler: result.rows[0]
    });
  } catch (err) {
    console.error('checkIn error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Trigger SOS
export const triggerSOS = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE traveler_safety
      SET sos_active = true
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Traveler not found' });
    }

    return res.json({
      success: true,
      traveler: result.rows[0]
    });
  } catch (err) {
    console.error('triggerSOS error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Toggle opt-in
export const toggleOptIn = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE traveler_safety
      SET opt_in = NOT opt_in
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Traveler not found' });
    }

    return res.json({
      success: true,
      traveler: result.rows[0]
    });
  } catch (err) {
    console.error('toggleOptIn error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
