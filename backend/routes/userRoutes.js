/*import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db.js';

const router = express.Router();

// ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Configure multer for file uploads - store files under backend/uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const name = Date.now() + path.extname(file.originalname);
    cb(null, name);
  }
});
const upload = multer({ storage });

// helper to build absolute URL for returned file
function fileUrl(req, filename){
  // if running behind a proxy or different host, adjust accordingly
  const host = req.get('host');
  const proto = req.protocol;
  return `${proto}://${host}/uploads/${filename}`;
}

// POST /api/user/photo
router.post('/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const photoPath = `/uploads/${req.file.filename}`;
    const photoUrl = fileUrl(req, req.file.filename);

    // Update in database (demo user id=1) - adjust as needed for real auth
    try{
      await pool.query('UPDATE users SET photo_url=$1 WHERE id=$2', [photoPath, 1]);
    }catch(dbErr){
      console.warn('DB update failed for photo:', dbErr.message || dbErr);
    }

    res.json({ success: true, photoUrl, photoPath });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/user/name
router.patch('/name', express.json(), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    try{
      await pool.query('UPDATE users SET name=$1 WHERE id=$2', [name, 1]);
    }catch(dbErr){
      console.warn('DB update failed for name:', dbErr.message || dbErr);
    }

    res.json({ success: true, name });
  } catch (error) {
    console.error('Name update error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
*/
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
//import { pool } from '../db.js';
import { pool } from '../config/db.js';


const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.resolve('./uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Helper to build absolute URL
function fileUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

/**
 * PATCH /api/user/name
 * Body: { id, name }
 * Updates the user's name dynamically
 */
router.patch('/name', express.json(), async (req, res) => {
  const { id, name } = req.body;

  if (!id) return res.status(400).json({ error: 'User ID required' });
  if (!name) return res.status(400).json({ error: 'Name required' });

  try {
    const result = await pool.query(
      'UPDATE users SET name=$1 WHERE id=$2 RETURNING *',
      [name, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Name update error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/user/photo
 * Form-data: file field name="photo", id
 * Updates user's photo dynamically
 */
router.post('/photo', upload.single('photo'), async (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: 'User ID required' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const photoPath = `/uploads/${req.file.filename}`;
  const photoUrl = fileUrl(req, req.file.filename);

  try {
    const result = await pool.query(
      'UPDATE users SET avatar=$1 WHERE id=$2 RETURNING *',
      [photoPath, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0], photoUrl });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
