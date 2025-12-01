import express from 'express';
import { login, register, logout, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', getCurrentUser);

export default router;
