import { pool } from '../config/db.js';

// Get all documents
export const getDocuments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, type, expiry, notes, path, size, 
             created_at as "createdAt"
      FROM documents
      ORDER BY created_at DESC
      LIMIT 500
    `);

    return res.json({
      success: true,
      documents: result.rows
    });
  } catch (err) {
    console.error('getDocuments error', err);
    return res.status(500).json({ success: false, error: err.message, documents: [] });
  }
};

// Create document
export const createDocument = async (req, res) => {
  try {
    const { name, type, expiry, notes } = req.body;
    const file = req.file;

    const result = await pool.query(`
      INSERT INTO documents (name, type, expiry, notes, path, size)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      name,
      type || 'other',
      expiry || null,
      notes || '',
      file?.path || null,
      file?.size || 0
    ]);

    return res.json({
      success: true,
      document: result.rows[0]
    });
  } catch (err) {
    console.error('createDocument error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Update document
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, expiry, notes } = req.body;

    const result = await pool.query(`
      UPDATE documents
      SET name = $1, type = $2, expiry = $3, notes = $4
      WHERE id = $5
      RETURNING *
    `, [name, type, expiry || null, notes || '', id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    return res.json({
      success: true,
      document: result.rows[0]
    });
  } catch (err) {
    console.error('updateDocument error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    return res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (err) {
    console.error('deleteDocument error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
