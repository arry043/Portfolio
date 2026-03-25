import { memo } from 'react';
import AboutSection from '../components/sections/AboutSection';
import PageTransition from '../components/layout/PageTransition';

const AboutPage = () => {
  return (
    <PageTransition className="pt-16">
      <AboutSection />
    </PageTransition>
  );
};

export default memo(AboutPage);
