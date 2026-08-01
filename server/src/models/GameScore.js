import mongoose from 'mongoose';

const gameScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    guestId: {
      type: String,
      default: null,
      index: true,
    },
    playerName: {
      type: String,
      default: 'Guest',
      trim: true,
      maxlength: 50,
    },
    gameSlug: {
      type: String,
      required: [true, 'Game slug is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: ['easy', 'medium', 'hard', 'expert'],
      index: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: 0,
    },
    time: {
      type: Number,
      required: true,
      min: 0,
    },
    moves: {
      type: Number,
      default: 0,
      min: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    wrongMatches: {
      type: Number,
      default: 0,
      min: 0,
    },
    hintsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPersonalBest: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for leaderboard queries
gameScoreSchema.index({ gameSlug: 1, difficulty: 1, score: -1 });
gameScoreSchema.index({ userId: 1, gameSlug: 1, difficulty: 1 });
gameScoreSchema.index({ guestId: 1, gameSlug: 1, difficulty: 1 });
gameScoreSchema.index({ gameSlug: 1, isPersonalBest: 1, score: -1 });

const GameScore = mongoose.model('GameScore', gameScoreSchema);
export default GameScore;
