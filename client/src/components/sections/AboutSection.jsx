import { memo, useEffect } from 'react';
import { MapPin, UserRound } from 'lucide-react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Card from '../ui/Card';
import SectionHeader from '../common/SectionHeader';
import SectionSkeleton from '../common/SectionSkeleton';
import EmptyState from '../common/EmptyState';
import { useResumeQuery } from '../../hooks/usePortfolioApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import { useTrackSectionView } from '../../hooks/useTrackEvent';

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
  const achievements = resumeQuery.data?.item?.achievements || [];

  return (
    <SectionWrapper id="about" bgVariant="primary" className="py-10 sm:py-12">
      <Container>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="About"
            title="Professional Summary"
            description="Compact profile, mission, and achievements from resume-backed data."
          />

          {resumeQuery.isLoading ? (
            <SectionSkeleton cardCount={2} />
          ) : !profile ? (
            <EmptyState message="Profile Data Unavailable" description="Unable to load profile details." />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Card className="border-zinc-800 bg-zinc-950/75 p-3 sm:p-4" hoverEffect={false}>
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                  <UserRound className="h-4 w-4 text-zinc-400" />
                  {profile.name || 'Your Name'}
                </p>
                <p className="mt-1 text-sm text-zinc-300">{profile.title || 'Developer'}</p>
                <p className="mt-2 text-sm text-zinc-400">
                  {profile.summary || 'No profile summary available.'}
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-zinc-500">
                  <MapPin className="h-4 w-4" />
                  {profile.location || 'Location unavailable'}
                </p>
              </Card>

              <Card className="border-zinc-800 bg-zinc-950/75 p-3 sm:p-4" hoverEffect={false}>
                <p className="text-sm font-semibold text-zinc-100">Achievements</p>
                {achievements.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-500">No achievements found.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {achievements.slice(0, 4).map((item, index) => (
                      <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-zinc-400">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(AboutSection);
