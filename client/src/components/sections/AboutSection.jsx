import { memo, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import SectionSkeleton from '../common/SectionSkeleton';
import EmptyState from '../common/EmptyState';
import { useResumeQuery } from '../../hooks/usePortfolioApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import { useTrackSectionView } from '../../hooks/useTrackEvent';

import AboutHeroIntro from '../about/AboutHeroIntro';
import ProfessionalSummary from '../about/ProfessionalSummary';
import SkillsTechStack from '../about/SkillsTechStack';
import ExperienceTimeline from '../about/ExperienceTimeline';
import AchievementsStats from '../about/AchievementsStats';
import EducationList from '../about/EducationList';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const AboutSection = () => {
  const resumeQuery = useResumeQuery();
  const toast = useToast();
  useTrackSectionView('about');

  useEffect(() => {
    if (resumeQuery.isError) {
      toast.error(getErrorMessage(resumeQuery.error), 'About Fetch Failed');
    }
  }, [resumeQuery.error, resumeQuery.isError, toast]);

  const profile = resumeQuery.data?.item?.profile;

  return (
    <SectionWrapper id="about" bgVariant="primary" className="py-16 sm:py-20">
      <Container>
        {resumeQuery.isLoading ? (
          <div className="space-y-6">
            <SectionSkeleton cardCount={3} />
          </div>
        ) : !profile ? (
          <EmptyState message="Profile Data Unavailable" description="Unable to load profile details at this time." />
        ) : (
          <Motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="w-full"
          >
            <AboutHeroIntro />
            
            <ProfessionalSummary summary={profile.summary} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">
              {/* Left Column */}
              <div className="flex flex-col">
                <ExperienceTimeline />
                <EducationList />
              </div>
              
              {/* Right Column */}
              <div className="flex flex-col">
                <SkillsTechStack />
                <AchievementsStats />
              </div>
            </div>
          </Motion.div>
        )}
      </Container>
    </SectionWrapper>
  );
};

export default memo(AboutSection);
