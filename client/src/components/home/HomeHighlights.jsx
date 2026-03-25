import { memo } from 'react';
import { ArrowRight, FolderGit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Card from '../ui/Card';
import SectionHeader from '../common/SectionHeader';
import EmptyState from '../common/EmptyState';

const HomeHighlights = ({ projects = [], skills = {} }) => {
  const topProjects = projects.slice(0, 3);
  const topSkills = Object.values(skills)
    .flat()
    .filter(Boolean)
    .slice(0, 8);

  return (
    <SectionWrapper id="highlights" bgVariant="primary" className="py-10 sm:py-12">
      <Container>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="Highlights"
            title="Short Technical Preview"
            description="Quick glance at stack depth and recent project work."
          />

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card className="border-zinc-800 bg-zinc-950/70 p-3 sm:p-4" hoverEffect={false}>
              <p className="text-sm font-semibold text-zinc-100">Top Skills</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {topSkills.length === 0 ? (
                  <p className="text-sm text-zinc-500">No skill highlights found.</p>
                ) : (
                  topSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                    >
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </Card>

            <Card className="border-zinc-800 bg-zinc-950/70 p-3 sm:p-4" hoverEffect={false}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-100">Project Preview</p>
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-1 text-sm text-zinc-300 transition-colors hover:text-zinc-100"
                >
                  All Projects
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-3 space-y-2">
                {topProjects.length === 0 ? (
                  <EmptyState
                    message="No Projects Found!"
                    description="Project highlights will appear here once available."
                    icon={FolderGit2}
                    className="min-h-28"
                  />
                ) : (
                  topProjects.map((project) => (
                    <div
                      key={project._id || project.title}
                      className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2.5"
                    >
                      <p className="truncate text-sm font-medium text-zinc-100" title={project.title}>
                        {project.title}
                      </p>
                      <p
                        className="mt-1 overflow-hidden text-sm text-zinc-400 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                        title={project.description}
                      >
                        {project.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(HomeHighlights);
