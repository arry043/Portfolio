import { create } from 'zustand';
import { getItem, setItem, removeItem } from '../lib/gameStorage';

/**
 * Generate a UUID-style guest identifier.
 */
const generateGuestId = () => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

/**
 * Cross-game state store.
 * Manages guest identity, best scores, and aggregate stats.
 */
const useGameStore = create((set, get) => ({
  // ─── Guest identity ──────────────────────────────────────────
  guestId: getItem('guest_id', null),

  getGuestId: () => {
    let id = get().guestId;
    if (!id) {
      id = generateGuestId();
      setItem('guest_id', id);
      set({ guestId: id });
    }
    return id;
  },

  // ─── Best scores: { [gameSlug]: { [difficulty]: { score, time, accuracy } } }
  bestScores: getItem('best_scores', {}),

  setBestScore: (gameSlug, difficulty, scoreData) => {
    const current = get().bestScores;
    const gameScores = current[gameSlug] || {};
    const existing = gameScores[difficulty];

    // Only update if new score is higher
    if (!existing || scoreData.score > existing.score) {
      const updated = {
        ...current,
        [gameSlug]: {
          ...gameScores,
          [difficulty]: {
            score: scoreData.score,
            time: scoreData.time,
            accuracy: scoreData.accuracy,
            completedAt: new Date().toISOString(),
          },
        },
      };
      setItem('best_scores', updated);
      set({ bestScores: updated });
      return true; // Was a new personal best
    }
    return false;
  },

  getBestScore: (gameSlug, difficulty) => {
    const current = get().bestScores;
    return current?.[gameSlug]?.[difficulty] || null;
  },

  getGameBestScores: (gameSlug) => {
    return get().bestScores?.[gameSlug] || {};
  },

  // ─── Clear guest data (post-merge or discard) ────────────────
  clearGuestData: () => {
    removeItem('guest_id');
    removeItem('best_scores');
    removeItem('game_state_memorization');
    set({ guestId: null, bestScores: {} });
  },
}));

export default useGameStore;
