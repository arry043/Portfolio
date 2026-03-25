import { memo } from 'react';
import { BrainCircuit, Code2, Server } from 'lucide-react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Card from '../ui/Card';
import SectionHeader from '../common/SectionHeader';

const ICON_BY_GROUP = {
  frontend: Code2,
  backend: Server,
  ai: BrainCircuit,
};

const HomeWhatIAm = ({ profile, skills = {} }) => {
  const skillGroups = Object.entries(skills).slice(0, 3);

  return (
    <SectionWrapper id="what-i-am" bgVariant="primary" className="py-10 sm:py-12">
      <Container>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="What I Am"
            title="Focused On Reliable Product Delivery"
            description="Role direction and capability snapshot powered by dynamic resume data."
          />

          <Card className="border-zinc-800 bg-zinc-950/70 p-3 sm:p-4" hoverEffect={false}>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-zinc-100">{profile?.title || 'Developer Portfolio'}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {profile?.summary || 'Building scalable systems with compact, performance-first UX.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {skillGroups.length === 0 ? (
                  <p className="text-sm text-zinc-500">No skills found.</p>
                ) : (
                  skillGroups.map(([group, values]) => {
                    const Icon = ICON_BY_GROUP[group] || Code2;

                    return (
                      <div
                        key={group}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3"
                      >
                        <div className="mb-2 inline-flex rounded-md border border-zinc-800 bg-zinc-950 p-1.5">
                          <Icon className="h-4 w-4 text-zinc-300" />
                        </div>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{group}</p>
                        <p className="mt-1 text-sm text-zinc-300">
                          {(values || []).slice(0, 3).join(' • ') || 'No skills listed'}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(HomeWhatIAm);
