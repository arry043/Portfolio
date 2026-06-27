import { memo, useEffect } from 'react';
import HeroSection from '../components/hero/HeroSection';
import HomeWhatIAm from '../components/home/HomeWhatIAm';
import HomeHighlights from '../components/home/HomeHighlights';
import CodingProfilesHighlights from '../components/sections/CodingProfilesHighlights';
import HomeContactCta from '../components/home/HomeContactCta';
import { useCertificatesQuery, useProjectsQuery, useResumeQuery, useSkillsQuery } from '../hooks/usePortfolioApi';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../lib/api';

const Home = () => {
  const resumeQuery = useResumeQuery();
  const projectsQuery = useProjectsQuery();
  const certificatesQuery = useCertificatesQuery();
  const skillsQuery = useSkillsQuery();
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

  useEffect(() => {
    if (skillsQuery.isError) {
      toast.error(getErrorMessage(skillsQuery.error), 'Skills Fetch Failed');
    }
  }, [skillsQuery.error, skillsQuery.isError, toast]);

  const resume = resumeQuery.data?.item || {};
  const projects = projectsQuery.data?.items || [];
  const certificates = certificatesQuery.data?.items || [];
  const dbSkills = skillsQuery.data?.items || [];

  return (
    <>
      <HeroSection
        profile={resume.profile}
        achievements={resume.achievements || []}
        projectCount={projects.length}
        certificateCount={certificates.length}
        experienceCount={(resume.experience || []).length}
        isLoading={resumeQuery.isLoading || projectsQuery.isLoading || certificatesQuery.isLoading}
      />
      <HomeWhatIAm profile={resume.profile} skills={resume.skills} isLoading={resumeQuery.isLoading} />
      <HomeHighlights
        projects={projects}
        skills={resume.skills}
        dbSkills={dbSkills}
        isLoading={resumeQuery.isLoading || projectsQuery.isLoading}
        isSkillsLoading={skillsQuery.isLoading}
      />
      <CodingProfilesHighlights />
      <HomeContactCta />
    </>
  );
};

export default memo(Home);
