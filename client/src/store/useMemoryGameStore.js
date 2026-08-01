import { create } from 'zustand';
import { getItem, setItem, removeItem } from '../lib/gameStorage';
import { TECH_CARDS } from '../lib/gameRegistry';

const STORAGE_KEY = 'game_state_memorization';

const GRID_CONFIGS = {
  easy: { cols: 4, rows: 4 },
  medium: { cols: 6, rows: 4 },
  hard: { cols: 6, rows: 6 },
  expert: { cols: 8, rows: 8 },
};

/**
 * Shuffle array (Fisher-Yates).
 * @param {any[]} array
 * @returns {any[]}
 */
const shuffleArray = (array) => {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Create a shuffled board of card pairs.
 * @param {string} difficulty
 * @returns {{ cards: object[], totalPairs: number }}
 */
const createBoard = (difficulty) => {
  const { cols, rows } = GRID_CONFIGS[difficulty] || GRID_CONFIGS.easy;
  const totalCards = cols * rows;
  const totalPairs = totalCards / 2;

  // Pick random techs and duplicate for pairs
  const shuffledTechs = shuffleArray(TECH_CARDS).slice(0, totalPairs);
  const cardPairs = [...shuffledTechs, ...shuffledTechs];
  const shuffled = shuffleArray(cardPairs);

  const cards = shuffled.map((tech, index) => ({
    id: index,
    tech,
    isFlipped: false,
    isMatched: false,
  }));

  return { cards, totalPairs };
};

/**
 * Get the initial game state.
 */
const getInitialState = () => ({
  cards: [],
  totalPairs: 0,
  difficulty: 'easy',
  status: 'idle', // idle | playing | paused | completed
  elapsedTime: 0,
  moves: 0,
  wrongMatches: 0,
  matchedPairs: 0,
  flippedIndices: [],
  isProcessing: false,
  hintsUsed: 0,
});

const useMemoryGameStore = create((set, get) => ({
  ...getInitialState(),

  /**
   * Initialize a new game with the given difficulty.
   */
  initGame: (difficulty = 'easy') => {
    const { cards, totalPairs } = createBoard(difficulty);
    const newState = {
      ...getInitialState(),
      cards,
      totalPairs,
      difficulty,
      status: 'idle',
    };
    set(newState);
    saveToStorage(newState);
  },

  /**
   * Flip a card by index.
   */
  flipCard: (index) => {
    const state = get();

    // Don't allow flips during processing, when paused, or when completed
    if (state.isProcessing || state.status === 'paused' || state.status === 'completed') {
      return;
    }

    const card = state.cards[index];
    if (!card || card.isFlipped || card.isMatched) return;

    // Can only flip 2 cards at a time
    if (state.flippedIndices.length >= 2) return;

    // Start game on first flip
    const newStatus = state.status === 'idle' ? 'playing' : state.status;

    const updatedCards = state.cards.map((c, i) =>
      i === index ? { ...c, isFlipped: true } : c
    );

    const newFlipped = [...state.flippedIndices, index];

    set({
      cards: updatedCards,
      flippedIndices: newFlipped,
      status: newStatus,
    });

    // If two cards are flipped, check for match
    if (newFlipped.length === 2) {
      set({ isProcessing: true });
      const [first, second] = newFlipped;
      const card1 = updatedCards[first];
      const card2 = updatedCards[second];

      if (card1.tech === card2.tech) {
        // Match!
        setTimeout(() => {
          const currentState = get();
          const matched = currentState.cards.map((c, i) =>
            i === first || i === second ? { ...c, isMatched: true } : c
          );
          const newMatchedPairs = currentState.matchedPairs + 1;
          const isComplete = newMatchedPairs === currentState.totalPairs;

          const update = {
            cards: matched,
            flippedIndices: [],
            moves: currentState.moves + 1,
            matchedPairs: newMatchedPairs,
            isProcessing: false,
            status: isComplete ? 'completed' : currentState.status,
          };

          set(update);
          saveToStorage({ ...currentState, ...update });
        }, 400);
      } else {
        // No match — flip back after delay
        setTimeout(() => {
          const currentState = get();
          const flippedBack = currentState.cards.map((c, i) =>
            i === first || i === second ? { ...c, isFlipped: false } : c
          );

          const update = {
            cards: flippedBack,
            flippedIndices: [],
            moves: currentState.moves + 1,
            wrongMatches: currentState.wrongMatches + 1,
            isProcessing: false,
          };

          set(update);
          saveToStorage({ ...currentState, ...update });
        }, 800);
      }
    } else {
      saveToStorage({ ...get() });
    }
  },

  /**
   * Increment timer by 1 second.
   */
  tick: () => {
    const state = get();
    if (state.status !== 'playing') return;
    const update = { elapsedTime: state.elapsedTime + 1 };
    set(update);
    // Save every 5 seconds to avoid excessive writes
    if (update.elapsedTime % 5 === 0) {
      saveToStorage({ ...state, ...update });
    }
  },

  /**
   * Pause the game.
   */
  pause: () => {
    const state = get();
    if (state.status === 'playing') {
      set({ status: 'paused' });
      saveToStorage({ ...state, status: 'paused' });
    }
  },

  /**
   * Resume the game.
   */
  resume: () => {
    const state = get();
    if (state.status === 'paused') {
      set({ status: 'playing' });
      saveToStorage({ ...state, status: 'playing' });
    }
  },

  /**
   * Restart with the same difficulty.
   */
  restart: () => {
    const { difficulty } = get();
    get().initGame(difficulty);
  },

  /**
   * Restore state from localStorage.
   * @returns {boolean} true if state was restored.
   */
  restoreFromStorage: () => {
    const saved = getItem(STORAGE_KEY, null);
    if (!saved || !saved.cards || saved.cards.length === 0) return false;

    // Don't restore completed games
    if (saved.status === 'completed') {
      removeItem(STORAGE_KEY);
      return false;
    }

    // Restore as paused so the timer doesn't auto-start
    set({
      ...saved,
      status: saved.status === 'playing' ? 'paused' : saved.status,
      isProcessing: false,
      flippedIndices: [],
    });
    return true;
  },

  /**
   * Clear saved state from localStorage.
   */
  clearStorage: () => {
    removeItem(STORAGE_KEY);
  },
}));

/**
 * Persist game state to localStorage.
 * @param {object} state
 */
const saveToStorage = (state) => {
  if (!state.cards || state.cards.length === 0) return;
  setItem(STORAGE_KEY, {
    cards: state.cards,
    totalPairs: state.totalPairs,
    difficulty: state.difficulty,
    status: state.status,
    elapsedTime: state.elapsedTime,
    moves: state.moves,
    wrongMatches: state.wrongMatches,
    matchedPairs: state.matchedPairs,
    hintsUsed: state.hintsUsed,
  });
};

export default useMemoryGameStore;
