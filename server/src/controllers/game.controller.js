import GameScore from '../models/GameScore.js';
import GameProgress from '../models/GameProgress.js';

// ─── Static game catalog ───────────────────────────────────────
const GAME_CATALOG = [
  {
    slug: 'memorization',
    title: 'Memorization',
    description: 'Match developer technology pairs to test your memory.',
    icon: 'Brain',
    difficulties: ['easy', 'medium', 'hard', 'expert'],
    available: true,
  },
];

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

const isValidSlug = (slug) =>
  GAME_CATALOG.some((g) => g.slug === slug && g.available);

// ─── GET /games/catalog ────────────────────────────────────────
export const getGameCatalog = async (_req, res, next) => {
  try {
    return res.json({ success: true, items: GAME_CATALOG });
  } catch (error) {
    return next(error);
  }
};

// ─── POST /games/scores ────────────────────────────────────────
export const submitScore = async (req, res, next) => {
  try {
    const {
      gameSlug,
      difficulty,
      score,
      time,
      moves,
      accuracy,
      wrongMatches,
      hintsUsed,
      guestId,
    } = req.body;

    if (!gameSlug || !isValidSlug(gameSlug)) {
      res.status(400);
      throw new Error('Invalid or missing game slug');
    }

    if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
      res.status(400);
      throw new Error('Invalid difficulty');
    }

    if (typeof score !== 'number' || score < 0) {
      res.status(400);
      throw new Error('Invalid score');
    }

    const isAuthenticated = !!req.user;
    const ownerId = isAuthenticated ? req.user._id : null;
    const ownerGuestId = isAuthenticated ? null : guestId || null;
    const playerName = isAuthenticated ? req.user.name : 'Guest';

    // Determine if this is a personal best
    const query = isAuthenticated
      ? { userId: ownerId, gameSlug, difficulty }
      : ownerGuestId
        ? { guestId: ownerGuestId, gameSlug, difficulty }
        : {};

    let isPersonalBest = false;

    if (Object.keys(query).length > 0) {
      const existingBest = await GameScore.findOne({
        ...query,
        isPersonalBest: true,
      });

      if (!existingBest || score > existingBest.score) {
        isPersonalBest = true;

        // Unmark the old personal best
        if (existingBest) {
          existingBest.isPersonalBest = false;
          await existingBest.save();
        }
      }
    }

    const newScore = await GameScore.create({
      userId: ownerId,
      guestId: ownerGuestId,
      playerName,
      gameSlug,
      difficulty,
      score,
      time: time || 0,
      moves: moves || 0,
      accuracy: accuracy || 0,
      wrongMatches: wrongMatches || 0,
      hintsUsed: hintsUsed || 0,
      isPersonalBest,
    });

    // Clear saved progress on completion (authenticated users)
    if (isAuthenticated) {
      await GameProgress.deleteOne({ userId: ownerId, gameSlug });
    }

    return res.status(201).json({
      success: true,
      score: newScore,
      isPersonalBest,
    });
  } catch (error) {
    return next(error);
  }
};

// ─── GET /games/leaderboard/:gameSlug ──────────────────────────
export const getLeaderboard = async (req, res, next) => {
  try {
    const { gameSlug } = req.params;
    const { difficulty, limit = 50 } = req.query;

    if (!gameSlug || !isValidSlug(gameSlug)) {
      res.status(400);
      throw new Error('Invalid game slug');
    }

    const filter = { gameSlug, isPersonalBest: true };

    if (difficulty && VALID_DIFFICULTIES.includes(difficulty)) {
      filter.difficulty = difficulty;
    }

    const entries = await GameScore.find(filter)
      .sort({ score: -1, time: 1 })
      .limit(Math.min(Number(limit) || 50, 100))
      .select('playerName score time moves accuracy difficulty completedAt userId guestId')
      .lean();

    return res.json({ success: true, entries });
  } catch (error) {
    return next(error);
  }
};

// ─── GET /games/my-scores/:gameSlug ────────────────────────────
export const getMyScores = async (req, res, next) => {
  try {
    const { gameSlug } = req.params;

    if (!gameSlug || !isValidSlug(gameSlug)) {
      res.status(400);
      throw new Error('Invalid game slug');
    }

    const bests = await GameScore.find({
      userId: req.user._id,
      gameSlug,
      isPersonalBest: true,
    })
      .sort({ difficulty: 1 })
      .select('difficulty score time moves accuracy wrongMatches completedAt')
      .lean();

    return res.json({ success: true, scores: bests });
  } catch (error) {
    return next(error);
  }
};

// ─── GET /games/my-rank/:gameSlug ──────────────────────────────
export const getMyRank = async (req, res, next) => {
  try {
    const { gameSlug } = req.params;
    const { difficulty } = req.query;

    if (!gameSlug || !isValidSlug(gameSlug)) {
      res.status(400);
      throw new Error('Invalid game slug');
    }

    const ranks = {};
    const diffs = difficulty
      ? [difficulty]
      : VALID_DIFFICULTIES;

    for (const diff of diffs) {
      // Get the user's personal best for this difficulty
      const userBest = await GameScore.findOne({
        userId: req.user._id,
        gameSlug,
        difficulty: diff,
        isPersonalBest: true,
      }).lean();

      if (!userBest) {
        ranks[diff] = { rank: null, score: null };
        continue;
      }

      // Count how many personal bests are strictly higher
      const higherCount = await GameScore.countDocuments({
        gameSlug,
        difficulty: diff,
        isPersonalBest: true,
        $or: [
          { score: { $gt: userBest.score } },
          { score: userBest.score, time: { $lt: userBest.time } },
        ],
      });

      ranks[diff] = {
        rank: higherCount + 1,
        score: userBest.score,
        time: userBest.time,
      };
    }

    return res.json({ success: true, ranks });
  } catch (error) {
    return next(error);
  }
};

// ─── POST /games/progress ──────────────────────────────────────
export const saveProgress = async (req, res, next) => {
  try {
    const { gameSlug, difficulty, state } = req.body;

    if (!gameSlug || !isValidSlug(gameSlug)) {
      res.status(400);
      throw new Error('Invalid game slug');
    }

    if (!state || typeof state !== 'object') {
      res.status(400);
      throw new Error('Invalid game state');
    }

    const progress = await GameProgress.findOneAndUpdate(
      { userId: req.user._id, gameSlug },
      { difficulty, state, userId: req.user._id, gameSlug },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({ success: true, progress });
  } catch (error) {
    return next(error);
  }
};

// ─── GET /games/progress/:gameSlug ─────────────────────────────
export const loadProgress = async (req, res, next) => {
  try {
    const { gameSlug } = req.params;

    if (!gameSlug || !isValidSlug(gameSlug)) {
      res.status(400);
      throw new Error('Invalid game slug');
    }

    const progress = await GameProgress.findOne({
      userId: req.user._id,
      gameSlug,
    }).lean();

    return res.json({ success: true, progress });
  } catch (error) {
    return next(error);
  }
};

// ─── DELETE /games/progress/:gameSlug ──────────────────────────
export const clearProgress = async (req, res, next) => {
  try {
    const { gameSlug } = req.params;

    await GameProgress.deleteOne({
      userId: req.user._id,
      gameSlug,
    });

    return res.json({ success: true, message: 'Progress cleared' });
  } catch (error) {
    return next(error);
  }
};

// ─── POST /games/merge ─────────────────────────────────────────
export const mergeGuestScores = async (req, res, next) => {
  try {
    const { guestId } = req.body;

    if (!guestId) {
      res.status(400);
      throw new Error('Guest ID is required');
    }

    const guestScores = await GameScore.find({ guestId });

    if (guestScores.length === 0) {
      return res.json({ success: true, merged: 0 });
    }

    let mergedCount = 0;

    for (const guestEntry of guestScores) {
      // Check if user already has a personal best for this game + difficulty
      const existingBest = await GameScore.findOne({
        userId: req.user._id,
        gameSlug: guestEntry.gameSlug,
        difficulty: guestEntry.difficulty,
        isPersonalBest: true,
      });

      const isNewBest = !existingBest || guestEntry.score > existingBest.score;

      if (isNewBest && existingBest) {
        existingBest.isPersonalBest = false;
        await existingBest.save();
      }

      // Transfer guest score to authenticated user
      guestEntry.userId = req.user._id;
      guestEntry.guestId = null;
      guestEntry.playerName = req.user.name;
      guestEntry.isPersonalBest = isNewBest;
      await guestEntry.save();

      mergedCount++;
    }

    return res.json({ success: true, merged: mergedCount });
  } catch (error) {
    return next(error);
  }
};
