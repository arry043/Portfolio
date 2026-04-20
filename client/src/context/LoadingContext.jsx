import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from './ToastContext';

const LoadingContext = createContext(null);

const FALLBACK_TIMEOUT_MS = 20000; // 20 seconds

export const LoadingProvider = ({ children }) => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [hasInitialDataLoaded, setHasInitialDataLoaded] = useState(false);
  const toast = useToast();

  const completeLoading = useCallback(() => {
    setHasInitialDataLoaded(true);
    // Add a slight delay before fully removing from DOM to allow fade-out animation
    setTimeout(() => {
      setIsAppLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Safety fallback: if background data doesn't load after 20s, show UI anyway
    const timer = setTimeout(() => {
      if (isAppLoading && !hasInitialDataLoaded) {
        console.warn('[LoadingSystem] Fallback timeout reached. Hiding loader.');
        toast.error('The server is taking longer than usual to wake up. Showing offline data.', 'Connection Delay');
        completeLoading();
      }
    }, FALLBACK_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isAppLoading, hasInitialDataLoaded, completeLoading, toast]);

  // When data is explicitly marked as loaded, trigger the completion
  useEffect(() => {
    if (hasInitialDataLoaded && isAppLoading) {
      completeLoading();
    }
  }, [hasInitialDataLoaded, isAppLoading, completeLoading]);

  return (
    <LoadingContext.Provider
      value={{
        isAppLoading,
        hasInitialDataLoaded,
        setHasInitialDataLoaded,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useGlobalLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }
  return context;
};
