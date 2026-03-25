import { memo, useEffect } from 'react';
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
import { formatExperiencePeriod } from '../../utils/date';

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
  const skillGroups = resume?.skills || {};

  return (
    <SectionWrapper id="experience" bgVariant="primary" className="py-10 sm:py-12">
      <Container>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="Experience"
            title="Skills And Work Highlights"
            description="Experience and skills are rendered dynamically from resume-backed data."
          />

          {resumeQuery.isLoading ? (
            <SectionSkeleton cardCount={2} />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Card className="space-y-4 border-zinc-800 bg-zinc-950/70 p-3 sm:p-4" hoverEffect={false}>
                <h3 className="text-sm font-semibold text-zinc-100">Core Skills</h3>
                <div className="space-y-3">
                  {Object.entries(skillGroups).length === 0 ? (
                    <p className="text-sm text-zinc-500">No skill data available.</p>
                  ) : (
                    Object.entries(skillGroups).map(([group, values]) => (
                      <div key={group} className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{group}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(values || []).map((skill) => (
                            <span
                              key={`${group}-${skill}`}
                              className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="space-y-4 border-zinc-800 bg-zinc-950/70 p-3 sm:p-4" hoverEffect={false}>
                <h3 className="text-sm font-semibold text-zinc-100">Experience Timeline</h3>
                <div className="space-y-3">
                  {experience.length === 0 ? (
                    <EmptyState
                      message="No Experience Found!"
                      description="Experience entries will appear here once available."
                    />
                  ) : (
                    experience.map((item) => (
                      <div key={`${item.role}-${item.company}`} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                        <p className="text-sm font-medium text-zinc-100">
                          {item.role} <span className="text-zinc-400">@ {item.company}</span>
                        </p>
                        <p className="text-xs text-zinc-500">{formatExperiencePeriod(item)}</p>
                        <ul className="mt-2 space-y-1">
                          {(item.highlights || []).map((highlight) => (
                            <li key={highlight} className="text-sm text-zinc-400">
                              - {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(ExperienceSection);
