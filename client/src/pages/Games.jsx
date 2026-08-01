import { memo } from 'react';
import PageTransition from '../components/layout/PageTransition';
import GameSection from '../components/sections/GameSection';

const LabsPage = () => {
  return (
    <PageTransition className="pt-16">
      <GameSection />
    </PageTransition>
  );
};

export default memo(LabsPage);
