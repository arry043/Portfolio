import { useState, useEffect, useCallback, useRef } from 'react';
import useAuthStore from '../store/useAuthStore';
import useGameStore from '../store/useGameStore';
import { useMergeGuestScores } from './useGameApi';
import { hasGuestData } from '../lib/gameStorage';

/**
 * Hook that watches for auth state changes and triggers
 * the merge progress modal when a user logs in and has
 * existing guest game data in localStorage.
 */
const useGameMergeCheck = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearGuestData = useGameStore((s) => s.clearGuestData);
  const getGuestId = useGameStore((s) => s.getGuestId);
  const mergeMutation = useMergeGuestScores();

  const [showMergeModal, setShowMergeModal] = useState(false);
  const prevAuthRef = useRef(isAuthenticated);

  // Watch for login transitions (was false → now true)
  useEffect(() => {
    const wasAuthenticated = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (!wasAuthenticated && isAuthenticated && hasGuestData()) {
      setShowMergeModal(true);
    }
  }, [isAuthenticated]);

  const handleMerge = useCallback(async () => {
    const guestId = getGuestId();
    try {
      await mergeMutation.mutateAsync({ guestId });
    } catch {
      // Even if merge fails, clear local data to avoid repeat prompts
    }
    clearGuestData();
    setShowMergeModal(false);
  }, [getGuestId, mergeMutation, clearGuestData]);

  const handleDiscard = useCallback(() => {
    clearGuestData();
    setShowMergeModal(false);
  }, [clearGuestData]);

  return {
    showMergeModal,
    handleMerge,
    handleDiscard,
    isMerging: mergeMutation.isPending,
  };
};

export default useGameMergeCheck;
