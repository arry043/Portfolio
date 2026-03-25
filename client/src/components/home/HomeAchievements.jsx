import { memo } from 'react';
import { BriefcaseBusiness, Medal, Sparkles } from 'lucide-react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Card from '../ui/Card';
import SectionHeader from '../common/SectionHeader';

const HomeAchievements = ({
  achievements = [],
  projectCount = 0,
  certificateCount = 0,
  experienceCount = 0,
}) => {
  const metrics = [
    { label: 'Projects', value: projectCount },
    { label: 'Certificates', value: certificateCount },
    { label: 'Experience Roles', value: experienceCount },
  ];

  return (
    <SectionWrapper id="achievements" bgVariant="secondary" className="py-10 sm:py-12">
      <Container>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="Achievements"
            title="Progress Snapshot"
            description="Dynamic summary generated from backend-backed portfolio content."
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <Card
                key={metric.label}
                className="border-zinc-800 bg-zinc-950/75 p-3 text-center"
                hoverEffect={false}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{metric.label}</p>
                <p className="mt-1 text-xl font-semibold text-zinc-100">{metric.value}</p>
              </Card>
            ))}
          </div>

          <Card className="border-zinc-800 bg-zinc-950/75 p-3 sm:p-4" hoverEffect={false}>
            <div className="space-y-2">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <Sparkles className="h-4 w-4 text-zinc-400" />
                Key Wins
              </p>
              {achievements.length === 0 ? (
                <p className="text-sm text-zinc-500">No achievements found.</p>
              ) : (
                <ul className="space-y-2">
                  {achievements.slice(0, 3).map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-zinc-300">
                      {index % 2 === 0 ? (
                        <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                      ) : (
                        <Medal className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                      )}
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(HomeAchievements);
