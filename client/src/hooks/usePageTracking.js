import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';

/**
 * Global site-wide tracking hook mapping route visits into the analytics database.
 * Auto-debounced to prevent strict-mode dev double fires.
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // We filter out admin routes to prevent messing with public telemetry
    if (location.pathname.startsWith('/admin')) return;
    
    const trackView = async () => {
      try {
        await api.post('/analytics/event', {
          page: location.pathname,
          type: 'view',
          delta: 1
        });
      } catch (err) {
        // Silently fails tracking without disrupting app behavior
      }
    };
    
    const timeoutId = setTimeout(trackView, 1000);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
};
