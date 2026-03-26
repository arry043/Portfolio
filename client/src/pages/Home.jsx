import { memo, useEffect } from 'react';
import HeroSection from '../components/hero/HeroSection';
import HomeWhatIAm from '../components/home/HomeWhatIAm';
import HomeAchievements from '../components/home/HomeAchievements';
import HomeHighlights from '../components/home/HomeHighlights';
import HomeContactCta from '../components/home/HomeContactCta';
import { useCertificatesQuery, useProjectsQuery, useResumeQuery } from '../hooks/usePortfolioApi';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../lib/api';

const Home = () => {
  const resumeQuery = useResumeQuery();
  const projectsQuery = useProjectsQuery();
  const certificatesQuery = useCertificatesQuery();
  const toast = useToast();

  useEffect(() => {
    if (resumeQuery.isError) {
      toast.error(getErrorMessage(resumeQuery.error), 'Resume Fetch Failed');
    }
  }, [resumeQuery.error, resumeQuery.isError, toast]);

  useEffect(() => {
    if (projectsQuery.isError) {
      toast.error(getErrorMessage(projectsQuery.error), 'Projects Fetch Failed');
    }
  }, [projectsQuery.error, projectsQuery.isError, toast]);

  useEffect(() => {
    if (certificatesQuery.isError) {
      toast.error(getErrorMessage(certificatesQuery.error), 'Certificates Fetch Failed');
    }
  }, [certificatesQuery.error, certificatesQuery.isError, toast]);

  const resume = resumeQuery.data?.item || {};
  const projects = projectsQuery.data?.items || [];
  const certificates = certificatesQuery.data?.items || [];

  return (
    <>
      <HeroSection profile={resume.profile} />
      <HomeWhatIAm profile={resume.profile} skills={resume.skills} />
      <HomeAchievements
        achievements={resume.achievements || []}
        projectCount={projects.length}
        certificateCount={certificates.length}
        experienceCount={(resume.experience || []).length}
      />
      <HomeHighlights projects={projects} skills={resume.skills} />
      <HomeContactCta />
    </>
  );
};

export default memo(Home);
