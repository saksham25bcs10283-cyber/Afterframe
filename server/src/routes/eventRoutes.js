import express from 'express';
import {
  listEvents,
  createEvent,
  joinEvent,
  leaveEvent,
  cancelEvent,
  getMyEvents
} from '../controllers/eventController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { requireDB } from '../config/db.js';

const router = express.Router();

router.get('/', requireDB, optionalAuth, listEvents);
router.post('/', requireDB, requireAuth, createEvent);
router.post('/:id/join', requireDB, requireAuth, joinEvent);
router.post('/:id/leave', requireDB, requireAuth, leaveEvent);
router.put('/:id/cancel', requireDB, requireAuth, cancelEvent);
router.get('/my/events', requireDB, requireAuth, getMyEvents);

export default router;
