import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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

// Helper to extract user ID from token
function getUserIdFromToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split(':')[0];
    return userId;
  } catch (err) {
    return null;
  }
}

/**
 * PATCH /api/user/name
 * Body: { name }
 * Updates the current user's name
 */
router.patch('/name', express.json(), async (req, res) => {
  const { name } = req.body;
  const userId = getUserIdFromToken(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - no valid token' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET name=$1 WHERE id=$2 RETURNING id, name, email, role, avatar',
      [name, userId]
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
 * Form-data: file field name="photo"
 * Updates current user's photo
 */
router.post('/photo', upload.single('photo'), async (req, res) => {
  const userId = getUserIdFromToken(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - no valid token' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const photoPath = `/uploads/${req.file.filename}`;
  const photoUrl = fileUrl(req, req.file.filename);

  try {
    const result = await pool.query(
      'UPDATE users SET avatar=$1 WHERE id=$2 RETURNING id, name, email, role, avatar',
      [photoPath, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0], photoUrl, avatarUrl: photoUrl });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
