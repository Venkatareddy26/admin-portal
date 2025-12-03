import { pool } from '../config/db.js';

// Get all policies
export const getPolicies = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, name, description, category, status, content, created_at as "createdAt"
      FROM policies
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      message: "Policies fetched successfully",
      policies: result.rows
    });
  } catch (err) {
    console.error('getPolicies error', err);
    return res.status(500).json({ success: false, error: err.message, policies: [] });
  }
};

// Create policy
export const createPolicy = async (req, res) => {
  try {
    const { title, name, description, category, status, content } = req.body;

    const result = await pool.query(`
      INSERT INTO policies (title, name, description, category, status, content)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title, name || title, description, category, status || 'Draft', content]);

    return res.json({ success: true, policy: result.rows[0] });
  } catch (err) {
    console.error('createPolicy error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Update policy
export const updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, name, description, category, status, content } = req.body;

    const result = await pool.query(`
      UPDATE policies
      SET title = $1, name = $2, description = $3, category = $4, status = $5, content = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [title, name || title, description, category, status, content, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Policy not found' });
    }

    return res.json({ success: true, policy: result.rows[0] });
  } catch (err) {
    console.error('updatePolicy error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Delete policy
export const deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM policies WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Policy not found' });
    }

    return res.json({ success: true, message: 'Policy deleted successfully' });
  } catch (err) {
    console.error('deletePolicy error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
