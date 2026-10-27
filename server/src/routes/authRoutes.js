import express from 'express';
import { register, login, getMe, updateProfile, updatePreferences } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDB } from '../config/db.js';

const router = express.Router();

router.post('/register', requireDB, register);
router.post('/login', requireDB, login);
router.get('/me', requireDB, requireAuth, getMe);
router.put('/profile', requireDB, requireAuth, updateProfile);
router.put('/preferences', requireDB, requireAuth, updatePreferences);

export default router;
