import { memo } from 'react';
import ExperienceSection from '../components/sections/ExperienceSection';
import PageTransition from '../components/layout/PageTransition';

const ExperiencePage = () => {
  return (
    <PageTransition className="pt-16">
      <ExperienceSection />
    </PageTransition>
  );
};

export default memo(ExperiencePage);
