import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js';
import {
  getGameCatalog,
  submitScore,
  getLeaderboard,
  getMyScores,
  getMyRank,
  saveProgress,
  loadProgress,
  clearProgress,
  mergeGuestScores,
} from '../controllers/game.controller.js';

const router = express.Router();

// Public
router.get('/catalog', getGameCatalog);
router.get('/leaderboard/:gameSlug', getLeaderboard);

// Guest or Authenticated
router.post('/scores', optionalAuth, submitScore);

// Authenticated only
router.get('/my-scores/:gameSlug', protect, getMyScores);
router.get('/my-rank/:gameSlug', protect, getMyRank);
router.post('/progress', protect, saveProgress);
router.get('/progress/:gameSlug', protect, loadProgress);
router.delete('/progress/:gameSlug', protect, clearProgress);
router.post('/merge', protect, mergeGuestScores);

export default router;
