/**
 * Reusable scoring engine for all mini-games.
 *
 * Each game can call `calculateScore()` with its raw stats
 * to get a normalized final score, accuracy, and grade.
 */

const DIFFICULTY_MULTIPLIERS = {
  easy: 1,
  medium: 1.5,
  hard: 2,
  expert: 3,
};

// Par times (seconds) — the "expected" completion time per difficulty
const PAR_TIMES = {
  easy: 60,
  medium: 120,
  hard: 180,
  expert: 300,
};

/**
 * Calculate a final score from raw game statistics.
 *
 * @param {Object} params
 * @param {number} params.totalPairs     – Total card pairs in the game
 * @param {number} params.time           – Elapsed time in seconds
 * @param {number} params.wrongMatches   – Number of wrong pair attempts
 * @param {number} params.hintsUsed      – Number of hints used
 * @param {string} params.difficulty     – Difficulty level
 * @returns {{ score: number, accuracy: number, grade: string }}
 */
export const calculateScore = ({
  totalPairs,
  time,
  wrongMatches = 0,
  hintsUsed = 0,
  difficulty = 'easy',
}) => {
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1;
  const parTime = PAR_TIMES[difficulty] || 120;

  // Base score from successfully matched pairs
  const baseScore = totalPairs * 100;

  // Time penalty: only penalize if above par
  const timePenalty = Math.max(0, time - parTime) * 2;

  // Wrong match penalty
  const wrongPenalty = wrongMatches * 15;

  // Hint penalty
  const hintPenalty = hintsUsed * 50;

  // Raw score before multiplier
  const rawScore = baseScore - timePenalty - wrongPenalty - hintPenalty;

  // Final score with difficulty multiplier (floor, never negative)
  const score = Math.max(0, Math.floor(rawScore * multiplier));

  // Accuracy: correct matches vs total attempts
  const totalAttempts = totalPairs + wrongMatches;
  const accuracy =
    totalAttempts > 0
      ? Math.round((totalPairs / totalAttempts) * 100)
      : 100;

  // Grade based on accuracy and score efficiency
  const grade = getGrade(accuracy, score, baseScore * multiplier);

  return { score, accuracy, grade };
};

/**
 * Determine a letter grade.
 * @param {number} accuracy
 * @param {number} finalScore
 * @param {number} maxPossible
 * @returns {string}
 */
const getGrade = (accuracy, finalScore, maxPossible) => {
  const ratio = maxPossible > 0 ? finalScore / maxPossible : 0;

  if (ratio >= 0.95 && accuracy >= 95) return 'S';
  if (ratio >= 0.85 && accuracy >= 85) return 'A';
  if (ratio >= 0.7 && accuracy >= 70) return 'B';
  if (ratio >= 0.5 && accuracy >= 50) return 'C';
  return 'D';
};

/**
 * Format time as mm:ss
 * @param {number} seconds
 * @returns {string}
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
