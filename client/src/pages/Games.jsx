import { memo } from 'react';
import PageTransition from '../components/layout/PageTransition';
import LazyMountSection from '../components/layout/LazyMountSection';
import GameSection from '../components/sections/GameSection';

const GamesPage = () => {
  return (
    <PageTransition className="pt-16">
      <LazyMountSection cardCount={2}>
        <GameSection />
      </LazyMountSection>
    </PageTransition>
  );
};

export default memo(GamesPage);
