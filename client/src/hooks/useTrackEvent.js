import { useCallback, useEffect, useRef } from 'react';
import { useAnalyticsMutation } from './usePortfolioApi';

export const useTrackSectionView = (page) => {
  const hasTrackedRef = useRef(false);
  const analyticsMutation = useAnalyticsMutation();

  useEffect(() => {
    if (!page || hasTrackedRef.current) {
      return;
    }

    hasTrackedRef.current = true;
    analyticsMutation.mutate({ page, type: 'view', delta: 1 });
  }, [analyticsMutation, page]);

  const trackClick = useCallback(() => {
    if (!page) {
      return;
    }

    analyticsMutation.mutate({ page, type: 'click', delta: 1 });
  }, [analyticsMutation, page]);

  return { trackClick };
};
