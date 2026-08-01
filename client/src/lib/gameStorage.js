/**
 * Versioned localStorage wrapper for game data.
 * All keys are namespaced to avoid collisions with other portfolio data.
 * Includes version tracking for future migrations.
 */

const STORAGE_VERSION = 1;
const NAMESPACE = 'portfolio_game';
const VERSION_KEY = `${NAMESPACE}_version`;

/**
 * Build a namespaced key.
 * @param {string} key
 * @returns {string}
 */
const buildKey = (key) => `${NAMESPACE}_v${STORAGE_VERSION}_${key}`;

/**
 * Run any pending migrations when storage version changes.
 */
const ensureVersion = () => {
  try {
    const stored = localStorage.getItem(VERSION_KEY);
    const currentVersion = stored ? Number(stored) : 0;

    if (currentVersion < STORAGE_VERSION) {
      // Future migration logic goes here
      // e.g. if (currentVersion < 2) { migrateV1toV2(); }
      localStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
    }
  } catch {
    // Storage unavailable — degrade silently
  }
};

// Run on module load
ensureVersion();

/**
 * Get a value from game storage.
 * @param {string} key
 * @param {*} fallback - Default value if key is missing or corrupted.
 * @returns {*}
 */
export const getItem = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(buildKey(key));
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

/**
 * Set a value in game storage.
 * @param {string} key
 * @param {*} value - Must be JSON-serializable.
 */
export const setItem = (key, value) => {
  try {
    localStorage.setItem(buildKey(key), JSON.stringify(value));
  } catch {
    // Storage full or unavailable — degrade silently
  }
};

/**
 * Remove a value from game storage.
 * @param {string} key
 */
export const removeItem = (key) => {
  try {
    localStorage.removeItem(buildKey(key));
  } catch {
    // Storage unavailable
  }
};

/**
 * Check if guest game data exists.
 * @returns {boolean}
 */
export const hasGuestData = () => {
  const guestId = getItem('guest_id');
  const bestScores = getItem('best_scores');
  return !!(guestId && bestScores && Object.keys(bestScores).length > 0);
};

/**
 * Clear all game-namespaced keys from localStorage.
 */
export const clearAllGameData = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(NAMESPACE)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage unavailable
  }
};

export default { getItem, setItem, removeItem, hasGuestData, clearAllGameData };
