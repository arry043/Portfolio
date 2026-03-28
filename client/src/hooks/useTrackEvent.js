import { useCallback, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { buildTrackingMetadata, shouldTrackOncePerSession } from '../lib/analyticsTracking';

const buildPayload = ({ page, type, endpoint }) => {
  const basePayload = {
    page,
    delta: 1,
    metadata: buildTrackingMetadata(typeof window !== 'undefined' ? window.location.pathname : page),
  };

  if (endpoint === '/analytics/event') {
    return { ...basePayload, type };
  }

  return basePayload;
};

export const useTrackSectionView = (page, options = {}) => {
  const {
    viewType = 'view',
    clickType = 'click',
    viewEndpoint = '/analytics/event',
    clickEndpoint = '/analytics/event',
    dedupeInSession = false,
  } = options;

  const hasTrackedRef = useRef(false);

  const postTrack = useCallback(
    (endpoint, type) => {
      if (!page || !endpoint) {
        return;
      }

      api.post(endpoint, buildPayload({ page, type, endpoint })).catch(() => {
        // Silently ignore telemetry failures.
      });
    },
    [page],
  );

  useEffect(() => {
    if (!page || hasTrackedRef.current) {
      return;
    }

    if (dedupeInSession) {
      const key = `section-view:${viewType}:${page}`;
      if (!shouldTrackOncePerSession(key)) {
        hasTrackedRef.current = true;
        return;
      }
    }

    hasTrackedRef.current = true;
    postTrack(viewEndpoint, viewType);
  }, [page, dedupeInSession, viewType, postTrack, viewEndpoint]);

  const trackClick = useCallback(() => {
    if (!page) {
      return;
    }

    postTrack(clickEndpoint, clickType);
  }, [page, clickEndpoint, clickType, postTrack]);

  return { trackClick };
};
