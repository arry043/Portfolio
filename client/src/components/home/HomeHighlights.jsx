import { memo, useState } from "react";
import { ArrowRight, FolderGit2, Github, ExternalLink, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import SectionWrapper from "../layout/SectionWrapper";
import Container from "../layout/Container";
import Card from "../ui/Card";
import SectionHeader from "../common/SectionHeader";
import EmptyState from "../common/EmptyState";
import SectionSkeleton from "../common/SectionSkeleton";
import SkillPreview from "./SkillPreview";
import { motion as Motion } from "framer-motion";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80";

const categoryColors = {
    MERN: "border-sky-700/40 bg-sky-950/40 text-sky-400",
    Django: "border-emerald-700/40 bg-emerald-950/40 text-emerald-400",
    AI: "border-violet-700/40 bg-violet-950/40 text-violet-400",
};

const projectCardVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut", delay: i * 0.1 },
    }),
};

const ACHIEVEMENTS = [
    { value: "300+", label: "LeetCode" },
    { value: "250+", label: "GFG Rank 20" },
    { value: "400+", label: "Naukri Problems" },
    { value: "GATE", label: "Qualified" },
    { value: "SIH", label: "Leader" },
    { value: "10+", label: "Open Source" },
];

const AchievementCard = memo(({ item, index }) => {
    return (
        <Motion.div
            variants={{
                hidden: { opacity: 0, y: 10 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.35, ease: "easeOut", delay: index * 0.05 }
                }
            }}
            whileHover={{
                scale: 1.03,
                borderColor: "rgba(113, 113, 122, 0.4)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(16, 185, 129, 0.05)",
            }}
            className="flex flex-col items-center justify-center p-2 text-center rounded-xl border border-zinc-800 bg-zinc-900/10 backdrop-blur-sm transition-all duration-300 min-h-[58px]"
        >
            <span className="text-sm font-extrabold text-white tracking-tight">{item.value}</span>
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{item.label}</span>
        </Motion.div>
    );
});

AchievementCard.displayName = "AchievementCard";

const AchievementsPanel = memo(() => {
    return (
        <Card
            className="border-zinc-800 bg-zinc-950/70 p-3 py-5 sm:p-4 flex flex-col h-full"
            hoverEffect={false}
        >
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                Achievements & Stats
            </p>

            <Motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.04
                        }
                    }
                }}
                className="grid py-4 grid-cols-2 gap-2 flex-1 items-center"
            >
                {ACHIEVEMENTS.map((item, index) => (
                    <AchievementCard key={item.label} item={item} index={index} />
                ))}
            </Motion.div>
        </Card>
    );
});

AchievementsPanel.displayName = "AchievementsPanel";

const ProjectCardImage = memo(({ src, alt }) => {
    const [loaded, setLoaded] = useState(false);
    const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);

    return (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-zinc-900">
            {!loaded ? (
                <div className="absolute inset-0 animate-pulse bg-zinc-800/70" />
            ) : null}
            <img
                src={imgSrc}
                alt={alt}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                onError={() => {
                    setImgSrc(FALLBACK_IMAGE);
                    setLoaded(true);
                }}
                className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.03] ${loaded ? "opacity-100" : "opacity-0"
                    }`}
            />
            {/* Subtle overlay gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
        </div>
    );
});

ProjectCardImage.displayName = "ProjectCardImage";

const ProjectCard = memo(({ project, index }) => {
    const colorClass =
        categoryColors[project.category] ||
        "border-zinc-700/40 bg-zinc-900/40 text-zinc-400";
    const tags = (project.tags || []).slice(0, 3);

    return (
        <Motion.div
            custom={index}
            variants={projectCardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
        >
            <Link to="/projects" className="group block">
                <div className="relative overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-900/30 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/70 hover:bg-zinc-900/50 hover:shadow-xl hover:shadow-zinc-950/50">
                    {/* Hover glow */}
                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-zinc-500/[0.03] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Image */}
                    <div className="p-2 pb-0">
                        <ProjectCardImage
                            src={project.image}
                            alt={project.title}
                        />
                    </div>

                    {/* Content */}
                    <div className="space-y-2 p-3 pt-2.5">
                        {/* Category + Views */}
                        <div className="flex items-center justify-between gap-2">
                            <span
                                className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colorClass}`}
                            >
                                {project.category}
                            </span>
                            {project.views > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                                    <Eye className="h-3 w-3" />
                                    {project.views}
                                </span>
                            ) : null}
                        </div>

                        {/* Title */}
                        <p
                            className="truncate text-sm font-semibold text-zinc-100 transition-colors group-hover:text-white"
                            title={project.title}
                        >
                            {project.title}
                        </p>

                        {/* Description */}
                        <p
                            className="overflow-hidden text-xs leading-relaxed text-zinc-400 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                            title={project.description}
                        >
                            {project.description}
                        </p>

                        {/* Tags */}
                        {tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-md border border-zinc-800/60 bg-zinc-950/50 px-1.5 py-0.5 text-[10px] text-zinc-500"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        ) : null}

                        {/* Links */}
                        {(project.github || project.live) ? (
                            <div className="flex items-center gap-2 border-t border-zinc-800/50 pt-2">
                                {project.github ? (
                                    <span
                                        className="inline-flex items-center gap-1 text-[11px] text-zinc-500 transition-colors group-hover:text-zinc-300"
                                    >
                                        <Github className="h-3 w-3" />
                                        Source
                                    </span>
                                ) : null}
                                {project.live ? (
                                    <span
                                        className="inline-flex items-center gap-1 text-[11px] text-zinc-500 transition-colors group-hover:text-zinc-300"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Live
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </Link>
        </Motion.div>
    );
});

ProjectCard.displayName = "ProjectCard";

const HomeHighlights = ({ projects = [], skills = {}, dbSkills = [], isLoading = false, isSkillsLoading = false }) => {
    const topProjects = projects.slice(0, 3);

    return (
        <SectionWrapper
            id="highlights"
            bgVariant="primary"
            className="py-10 sm:py-12"
        >
            <Container>
                <div className="space-y-5">
                    <SectionHeader
                        eyebrow="Highlights"
                        title="Short Technical Preview"
                        description="Quick glance at stack depth and recent project work."
                    />

                    {isLoading ? (
                        <SectionSkeleton cardCount={2} variant="split" />
                    ) : (
                        <Motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-4"
                        >
                            {/* Skill Preview & Achievements Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                                <div className="lg:col-span-2">
                                    <SkillPreview
                                        skills={dbSkills}
                                        isLoading={isSkillsLoading}
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <AchievementsPanel />
                                </div>
                            </div>

                            {/* Project Preview — modern card grid */}
                            <Card
                                className="border-zinc-800 bg-zinc-950/70 p-3 sm:p-4"
                                hoverEffect={false}
                            >
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-zinc-100">
                                        Project Preview
                                    </p>
                                    <Link
                                        to="/projects"
                                        className="group/link inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                                    >
                                        All Projects
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
                                    </Link>
                                </div>

                                {topProjects.length === 0 ? (
                                    <EmptyState
                                        message="No Projects Found!"
                                        description="Project highlights will appear here once available."
                                        icon={FolderGit2}
                                        className="min-h-28"
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                        {topProjects.map((project, index) => (
                                            <ProjectCard
                                                key={project._id || project.title}
                                                project={project}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </Motion.div>
                    )}
                </div>
            </Container>
        </SectionWrapper>
    );
};

export default memo(HomeHighlights);
