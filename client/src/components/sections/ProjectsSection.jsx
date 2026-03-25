import { memo, useEffect, useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Code2, ExternalLink } from 'lucide-react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Card from '../ui/Card';
import SectionHeader from '../common/SectionHeader';
import ImageWithSkeleton from '../common/ImageWithSkeleton';
import SectionSkeleton from '../common/SectionSkeleton';
import EmptyState from '../common/EmptyState';
import { useProjectsQuery } from '../../hooks/usePortfolioApi';
import { projectCategorySchema } from '../../schemas/forms';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import { useTrackSectionView } from '../../hooks/useTrackEvent';
import { formatMonthYear, parseLegacyProjectDate } from '../../utils/date';

const FILTERS = ['All', 'MERN', 'Django', 'AI'];

const ProjectCard = memo(({ project, onOutboundClick }) => {
  const hasLiveLink = Boolean(project.live);
  const hasGithubLink = Boolean(project.github);
  const projectTimelineDate = project.projectDate || parseLegacyProjectDate(project.date);
  const projectDateLabel = formatMonthYear(projectTimelineDate, project.date || 'Date not specified');

  return (
    <Motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
      <Card className="h-full overflow-hidden border-zinc-800 bg-zinc-950/75" hoverEffect>
        <ImageWithSkeleton src={project.image} alt={project.title} className="h-36 w-full" />
        <div className="space-y-3 p-3">
          <div className="space-y-2">
            <h3 className="truncate text-sm font-semibold text-zinc-100" title={project.title}>
              {project.title}
            </h3>
            <p className="text-xs text-zinc-500">{projectDateLabel}</p>
            <p className="overflow-hidden text-sm text-zinc-400 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
              {project.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(project.tags || []).slice(0, 4).map((tag) => (
              <span
                key={`${project._id}-${tag}`}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                title={tag}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={hasLiveLink ? project.live : '#'}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                if (!hasLiveLink) {
                  event.preventDefault();
                  return;
                }

                onOutboundClick();
              }}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                hasLiveLink
                  ? 'border-zinc-700 bg-zinc-100 text-zinc-950 hover:bg-zinc-200'
                  : 'cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500'
              }`}
              aria-disabled={!hasLiveLink}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live
            </a>
            <a
              href={hasGithubLink ? project.github : '#'}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                if (!hasGithubLink) {
                  event.preventDefault();
                  return;
                }

                onOutboundClick();
              }}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                hasGithubLink
                  ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  : 'cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500'
              }`}
              aria-disabled={!hasGithubLink}
            >
              <Code2 className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </Card>
    </Motion.div>
  );
});

const ProjectsSection = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const toast = useToast();
  const { trackClick } = useTrackSectionView('projects');

  const validatedFilter = useMemo(() => {
    const parsedFilter = projectCategorySchema.safeParse(activeFilter);
    return parsedFilter.success ? parsedFilter.data : 'All';
  }, [activeFilter]);

  const projectsQuery = useProjectsQuery({ category: validatedFilter });

  useEffect(() => {
    if (projectsQuery.isError) {
      toast.error(getErrorMessage(projectsQuery.error), 'Projects Fetch Failed');
    }
  }, [projectsQuery.error, projectsQuery.isError, toast]);

  const projects = projectsQuery.data?.items || [];

  return (
    <SectionWrapper id="projects" bgVariant="primary" className="py-10 sm:py-12">
      <Container>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="Projects"
            title="Dynamic Project Showcase"
            description="Projects are fetched from backend APIs and optimized for compact readability."
          />

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  validatedFilter === filter
                    ? 'border-zinc-100 bg-zinc-100 text-zinc-950'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {projectsQuery.isLoading ? (
            <SectionSkeleton cardCount={6} />
          ) : projects.length === 0 ? (
            <EmptyState
              message="No Projects Found!"
              description="Projects will appear here once data is available from backend."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onOutboundClick={() => trackClick()}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(ProjectsSection);
