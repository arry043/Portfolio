import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// ─── Query Keys ────────────────────────────────────────────────
export const gameQueryKeys = {
  catalog: ['game-catalog'],
  leaderboard: (gameSlug, difficulty) => ['game-leaderboard', gameSlug, difficulty],
  myScores: (gameSlug) => ['game-my-scores', gameSlug],
  myRank: (gameSlug) => ['game-my-rank', gameSlug],
  progress: (gameSlug) => ['game-progress', gameSlug],
};

// ─── Fetchers ──────────────────────────────────────────────────
const fetchCatalog = async () => {
  const response = await api.get('/games/catalog');
  return response.data;
};

const fetchLeaderboard = async (gameSlug, difficulty) => {
  const params = {};
  if (difficulty && difficulty !== 'overall') {
    params.difficulty = difficulty;
  }
  const response = await api.get(`/games/leaderboard/${gameSlug}`, { params });
  return response.data;
};

const fetchMyScores = async (gameSlug) => {
  const response = await api.get(`/games/my-scores/${gameSlug}`);
  return response.data;
};

const fetchMyRank = async (gameSlug) => {
  const response = await api.get(`/games/my-rank/${gameSlug}`);
  return response.data;
};

const fetchProgress = async (gameSlug) => {
  const response = await api.get(`/games/progress/${gameSlug}`);
  return response.data;
};

const submitScore = async (payload) => {
  const response = await api.post('/games/scores', payload);
  return response.data;
};

const saveProgress = async (payload) => {
  const response = await api.post('/games/progress', payload);
  return response.data;
};

const clearProgress = async (gameSlug) => {
  const response = await api.delete(`/games/progress/${gameSlug}`);
  return response.data;
};

const mergeGuest = async (payload) => {
  const response = await api.post('/games/merge', payload);
  return response.data;
};

// ─── Hooks ─────────────────────────────────────────────────────

export const useGameCatalog = () =>
  useQuery({
    queryKey: gameQueryKeys.catalog,
    queryFn: fetchCatalog,
    staleTime: 300_000,
  });

export const useLeaderboard = (gameSlug, difficulty = 'overall') =>
  useQuery({
    queryKey: gameQueryKeys.leaderboard(gameSlug, difficulty),
    queryFn: () => fetchLeaderboard(gameSlug, difficulty),
    staleTime: 30_000,
    enabled: !!gameSlug,
  });

export const useMyScores = (gameSlug, enabled = true) =>
  useQuery({
    queryKey: gameQueryKeys.myScores(gameSlug),
    queryFn: () => fetchMyScores(gameSlug),
    enabled: !!gameSlug && enabled,
    staleTime: 60_000,
  });

export const useMyRank = (gameSlug, enabled = true) =>
  useQuery({
    queryKey: gameQueryKeys.myRank(gameSlug),
    queryFn: () => fetchMyRank(gameSlug),
    enabled: !!gameSlug && enabled,
    staleTime: 60_000,
  });

export const useLoadProgress = (gameSlug, enabled = true) =>
  useQuery({
    queryKey: gameQueryKeys.progress(gameSlug),
    queryFn: () => fetchProgress(gameSlug),
    enabled: !!gameSlug && enabled,
    staleTime: 0,
  });

export const useSubmitScore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitScore,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: gameQueryKeys.leaderboard(variables.gameSlug, variables.difficulty),
      });
      queryClient.invalidateQueries({
        queryKey: gameQueryKeys.myScores(variables.gameSlug),
      });
      queryClient.invalidateQueries({
        queryKey: gameQueryKeys.myRank(variables.gameSlug),
      });
    },
  });
};

export const useSaveProgress = () =>
  useMutation({ mutationFn: saveProgress });

export const useClearProgress = () =>
  useMutation({ mutationFn: clearProgress });

export const useMergeGuestScores = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mergeGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-'] });
    },
  });
};
