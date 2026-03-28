import { useAuth, useUser } from '@clerk/clerk-react';
import { useCallback, useRef } from 'react';
import { getClerkPrimaryEmail, syncClerkUserWithBackend } from '../lib/auth';
import useAuthStore from '../store/useAuthStore';

const useBackendAuthSync = () => {
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const inFlightRef = useRef(null);

  const syncSession = useCallback(
    async ({ force = false } = {}) => {
      if (!isAuthLoaded || !isUserLoaded || !isSignedIn || !clerkUser) {
        return null;
      }

      const clerkEmail = getClerkPrimaryEmail(clerkUser);
      if (!clerkEmail) {
        throw new Error('Clerk account does not have a primary email');
      }

      if (!force && isAuthenticated) {
        return null;
      }

      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      const task = (async () => {
        const clerkToken = await getToken();
        if (!clerkToken) {
          throw new Error('Unable to fetch Clerk token');
        }

        const synced = await syncClerkUserWithBackend({ clerkToken, clerkUser });
        login(synced.user, synced.token);
        return synced;
      })();

      inFlightRef.current = task;

      try {
        return await task;
      } finally {
        inFlightRef.current = null;
      }
    },
    [
      isAuthLoaded,
      isUserLoaded,
      isSignedIn,
      clerkUser,
      isAuthenticated,
      getToken,
      login,
    ],
  );

  return { syncSession };
};

export default useBackendAuthSync;
