import axiosInstance from './axios';

export const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

export const getClerkPrimaryEmail = (clerkUser) =>
  normalizeEmail(clerkUser?.primaryEmailAddress?.emailAddress || '');

export const getClerkDisplayName = (clerkUser) =>
  String(clerkUser?.fullName || clerkUser?.firstName || '').trim();

export const getClerkImageUrl = (clerkUser) => String(clerkUser?.imageUrl || '').trim();

export const syncClerkUserWithBackend = async ({ clerkToken, clerkUser }) => {
  const response = await axiosInstance.post('/auth/sync-user', {
    token: clerkToken,
    email: getClerkPrimaryEmail(clerkUser) || undefined,
    name: getClerkDisplayName(clerkUser) || undefined,
    profileImage: getClerkImageUrl(clerkUser) || undefined,
    provider: 'google',
  });

  return response.data;
};
