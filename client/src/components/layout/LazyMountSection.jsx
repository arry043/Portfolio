import { Suspense, memo } from 'react';
import { useInViewMount } from '../../hooks/useInViewMount';
import SectionSkeleton from '../common/SectionSkeleton';

const LazyMountSection = ({ children, cardCount = 3 }) => {
  const { targetRef, isMounted } = useInViewMount({ rootMargin: '180px 0px' });

  return (
    <div ref={targetRef}>
      {isMounted ? (
        <Suspense fallback={<SectionSkeleton cardCount={cardCount} />}>
          {children}
        </Suspense>
      ) : (
        <SectionSkeleton cardCount={cardCount} />
      )}
    </div>
  );
};

export default memo(LazyMountSection);
