import mongoose from 'mongoose';

const gameProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    gameSlug: {
      type: String,
      required: [true, 'Game slug is required'],
      trim: true,
      lowercase: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard', 'expert'],
    },
    state: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Game state is required'],
    },
  },
  {
    timestamps: true,
  }
);

// One save slot per user per game
gameProgressSchema.index({ userId: 1, gameSlug: 1 }, { unique: true });

const GameProgress = mongoose.model('GameProgress', gameProgressSchema);
export default GameProgress;
