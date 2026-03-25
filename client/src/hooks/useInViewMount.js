import { useEffect, useRef, useState } from 'react';

export const useInViewMount = (options = {}) => {
  const targetRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isMounted) {
      return undefined;
    }

    const targetNode = targetRef.current;
    if (!targetNode) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMounted(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin || '160px 0px',
        threshold: options.threshold || 0.1,
      }
    );

    observer.observe(targetNode);

    return () => observer.disconnect();
  }, [isMounted, options.rootMargin, options.threshold]);

  return { targetRef, isMounted };
};
