import { memo } from 'react';
import ProjectsSection from '../components/sections/ProjectsSection';
import PageTransition from '../components/layout/PageTransition';

const ProjectsPage = () => {
  return (
    <PageTransition className="pt-16">
      <ProjectsSection />
    </PageTransition>
  );
};

export default memo(ProjectsPage);
