import express from 'express';
import {
  getTrendingPeopleWithVotes,
  togglePersonUpvote,
  toggleFollowPerson,
  getFollowedPeople,
  getTitleCommunityStats,
  upsertRatingReview,
  deleteRatingReview,
  getReviewPulse,
  getTasteMatchScore,
  getPersonalizedRecommendations
} from '../controllers/communityController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { requireDB } from '../config/db.js';

const router = express.Router();

// Trending People with Community Upvotes
router.get('/people/trending', optionalAuth, getTrendingPeopleWithVotes);
router.post('/people/upvote', requireDB, requireAuth, togglePersonUpvote);

// Celebrity Following (Personal follow list, independent of upvoting)
router.post('/people/follow', requireDB, requireAuth, toggleFollowPerson);
router.get('/people/following', requireDB, requireAuth, getFollowedPeople);

// Title Ratings & Reviews
router.get('/title/:tmdbId/stats', optionalAuth, getTitleCommunityStats);
router.post('/title/rate', requireDB, requireAuth, upsertRatingReview);
router.delete('/title/review/:id', requireDB, requireAuth, deleteRatingReview);

// Review Pulse
router.get('/title/:tmdbId/pulse', getReviewPulse);

// Taste Match Score (Unobtrusive compatibility score)
router.get('/taste-match/:mediaType/:tmdbId', optionalAuth, getTasteMatchScore);

// Personalized Recommendations
router.get('/recommendations', requireDB, requireAuth, getPersonalizedRecommendations);

export default router;
