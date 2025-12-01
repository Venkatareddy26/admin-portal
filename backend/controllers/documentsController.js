import { pool } from '../config/db.js';

export const getDocuments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, trip_id as "tripId", title, file_path as "filePath", 
             file_type as "fileType", uploaded_by as "uploadedBy", created_at as "createdAt"
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
