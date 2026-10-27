import express from 'express';
import {
  getWatchlist,
  addToWatchlist,
  updateWatchlistStatus,
  removeFromWatchlist,
  syncGuestWatchlist,
  getMyCinemaStats
} from '../controllers/watchlistController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDB } from '../config/db.js';

const router = express.Router();

router.get('/', requireDB, requireAuth, getWatchlist);
router.post('/', requireDB, requireAuth, addToWatchlist);
router.put('/:id', requireDB, requireAuth, updateWatchlistStatus);
router.delete('/:id', requireDB, requireAuth, removeFromWatchlist);
router.post('/sync-guest', requireDB, requireAuth, syncGuestWatchlist);
router.get('/stats', requireDB, requireAuth, getMyCinemaStats);

export default router;
