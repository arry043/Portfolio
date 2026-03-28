import { useAuth, useClerk } from '@clerk/clerk-react';
import { useCallback, useRef, useState } from 'react';
import useAuthStore from '../store/useAuthStore';

const useUnifiedLogout = () => {
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const logout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const inFlightRef = useRef(false);

  const logoutEverywhere = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setIsLoggingOut(true);
    logout();

    try {
      if (isSignedIn) {
        await signOut();
      }
    } finally {
      setIsLoggingOut(false);
      inFlightRef.current = false;
    }
  }, [isSignedIn, logout, signOut]);

  return { logoutEverywhere, isLoggingOut };
};

export default useUnifiedLogout;
