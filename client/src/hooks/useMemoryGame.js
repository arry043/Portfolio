import { useEffect, useRef, useCallback } from 'react';
import useMemoryGameStore from '../store/useMemoryGameStore';
import useGameStore from '../store/useGameStore';
import useAuthStore from '../store/useAuthStore';
import { useSubmitScore } from './useGameApi';
import { calculateScore } from '../lib/scoringEngine';

const GAME_SLUG = 'memorization';

/**
 * Core game logic hook for the Memory Matching Game.
 * Separates game logic, timer management, tab visibility, and
 * persistence from UI concerns.
 */
const useMemoryGame = () => {
  const store = useMemoryGameStore();
  const gameStore = useGameStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const submitScoreMutation = useSubmitScore();

  const timerRef = useRef(null);
  const hasRestoredRef = useRef(false);

  const {
    cards,
    totalPairs,
    difficulty,
    status,
    elapsedTime,
    moves,
    wrongMatches,
    matchedPairs,
    flippedIndices,
    isProcessing,
    hintsUsed,
  } = store;

  // ─── Computed values ─────────────────────────────────────────
  const totalAttempts = matchedPairs + wrongMatches;
  const accuracy =
    totalAttempts > 0 ? Math.round((matchedPairs / totalAttempts) * 100) : 100;

  const currentScoreData = calculateScore({
    totalPairs,
    time: elapsedTime,
    wrongMatches,
    hintsUsed,
    difficulty,
  });

  // ─── Timer management ────────────────────────────────────────
  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => {
        store.tick();
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-pause on tab blur ──────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && status === 'playing') {
        store.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Restore from localStorage on mount ──────────────────────
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restored = store.restoreFromStorage();
    if (!restored) {
      store.initGame('easy');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handle game completion ──────────────────────────────────
  useEffect(() => {
    if (status !== 'completed') return;

    const scoreData = calculateScore({
      totalPairs,
      time: elapsedTime,
      wrongMatches,
      hintsUsed,
      difficulty,
    });

    // Save to local store (guest or auth)
    const isNewBest = gameStore.setBestScore(GAME_SLUG, difficulty, {
      score: scoreData.score,
      time: elapsedTime,
      accuracy: scoreData.accuracy,
    });

    // Submit to backend
    const payload = {
      gameSlug: GAME_SLUG,
      difficulty,
      score: scoreData.score,
      time: elapsedTime,
      moves,
      accuracy: scoreData.accuracy,
      wrongMatches,
      hintsUsed,
    };

    if (!isAuthenticated) {
      payload.guestId = gameStore.getGuestId();
    }

    submitScoreMutation.mutate(payload);

    // Clear saved progress
    store.clearStorage();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ─────────────────────────────────────────────────
  const initGame = useCallback(
    (diff) => {
      store.initGame(diff);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const flipCard = useCallback(
    (cardId) => {
      store.flipCard(cardId);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const pause = useCallback(() => {
    store.pause();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resume = useCallback(() => {
    store.resume();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = useCallback(() => {
    store.restart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeDifficulty = useCallback(
    (diff) => {
      store.initGame(diff);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    // State
    cards,
    totalPairs,
    difficulty,
    status,
    elapsedTime,
    moves,
    wrongMatches,
    matchedPairs,
    flippedIndices,
    isProcessing,
    hintsUsed,
    accuracy,
    currentScore: currentScoreData.score,
    grade: currentScoreData.grade,

    // Actions
    initGame,
    flipCard,
    pause,
    resume,
    restart,
    changeDifficulty,
  };
};

export default useMemoryGame;
