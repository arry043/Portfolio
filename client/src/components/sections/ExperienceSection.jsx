import { memo, useEffect } from 'react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import SectionSkeleton from '../common/SectionSkeleton';
import { useResumeQuery } from '../../hooks/usePortfolioApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import { useTrackSectionView } from '../../hooks/useTrackEvent';
import ExperienceTimeline from '../experience/ExperienceTimeline';

const ExperienceSection = () => {
  const resumeQuery = useResumeQuery();
  const toast = useToast();
  useTrackSectionView('experience');

  useEffect(() => {
    if (resumeQuery.isError) {
      toast.error(getErrorMessage(resumeQuery.error), 'Resume Fetch Failed');
    }
  }, [resumeQuery.error, resumeQuery.isError, toast]);

  const resume = resumeQuery.data?.item;
  const experience = resume?.experience || [];

  return (
    <SectionWrapper id="experience" bgVariant="primary" className="py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="space-y-8 sm:space-y-12">
          <SectionHeader
            eyebrow="Experience"
            title="Professional Journey"
            description="A timeline of my work history, roles, and impact across various products and companies."
          />

          {resumeQuery.isLoading ? (
            <SectionSkeleton cardCount={3} />
          ) : (
            <ExperienceTimeline experiences={experience} />
          )}
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(ExperienceSection);
