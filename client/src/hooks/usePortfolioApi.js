import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { buildTrackingMetadata } from '../lib/analyticsTracking';

const queryKeys = {
  projects: (filters) => ['projects', filters],
  certificates: ['certificates'],
  resume: ['resume-content'],
  games: ['games'],
};

const fetchProjects = async (filters = {}) => {
  const response = await api.get('/projects', {
    params: {
      category: filters.category && filters.category !== 'All' ? filters.category : undefined,
    },
  });

  return response.data;
};

const fetchCertificates = async () => {
  const response = await api.get('/certificates');
  return response.data;
};

const fetchResume = async () => {
  const response = await api.get('/resume');
  return response.data;
};

const fetchGames = async () => {
  const response = await api.get('/games');
  return response.data;
};

const sendContact = async (payload) => {
  const response = await api.post('/contact', payload);
  return response.data;
};

const askChatbot = async (payload) => {
  const response = await api.post('/ai/chat', payload);
  return response.data;
};

const trackEvent = async (payload) => {
  const route = payload?.metadata?.route || payload?.page;
  const response = await api.post('/analytics/event', {
    ...payload,
    metadata: {
      ...buildTrackingMetadata(route),
      ...(payload?.metadata || {}),
    },
  });
  return response.data;
};

export const useProjectsQuery = (filters) =>
  useQuery({
    queryKey: queryKeys.projects(filters),
    queryFn: () => fetchProjects(filters),
  });

export const useCertificatesQuery = () =>
  useQuery({
    queryKey: queryKeys.certificates,
    queryFn: fetchCertificates,
  });

export const useResumeQuery = () =>
  useQuery({
    queryKey: queryKeys.resume,
    queryFn: fetchResume,
    staleTime: 120_000,
  });

export const useGamesQuery = () =>
  useQuery({
    queryKey: queryKeys.games,
    queryFn: fetchGames,
    staleTime: 120_000,
  });

export const useContactMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume });
    },
  });
};

export const useChatMutation = () => useMutation({ mutationFn: askChatbot });

export const useAnalyticsMutation = () => useMutation({ mutationFn: trackEvent });

export { queryKeys };
