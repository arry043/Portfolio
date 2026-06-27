import { memo, useRef } from 'react';
import { motion as Motion, useInView } from 'framer-motion';
import { useSkillsQuery } from '../../hooks/usePortfolioApi';
import { Sparkles, Terminal, Cpu, Database, Layout, Settings } from 'lucide-react';

const itemAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const DEFAULT_SKILLS = [
  { skill: "Python", category: "Language", percentage: 100, logo: "" },
  { skill: "MongoDB", category: "Database", percentage: 95, logo: "" },
  { skill: "Express.js", category: "Backend", percentage: 93, logo: "" },
  { skill: "React.js", category: "Frontend", percentage: 90, logo: "" },
  { skill: "Node.js", category: "Backend", percentage: 90, logo: "" },
  { skill: "Docker", category: "DevOps", percentage: 80, logo: "" },
  { skill: "Redis", category: "Database", percentage: 80, logo: "" }
];

// Helper to get category icons
const getCategoryIcon = (category = '') => {
  const lower = category.toLowerCase();
  if (lower.includes('lang') || lower.includes('prog')) return Terminal;
  if (lower.includes('data') || lower.includes('db')) return Database;
  if (lower.includes('back') || lower.includes('server')) return Cpu;
  if (lower.includes('front') || lower.includes('design') || lower.includes('ui')) return Layout;
  if (lower.includes('devops') || lower.includes('tool') || lower.includes('infra')) return Settings;
  return Sparkles;
};

const PremiumSkillCard = memo(({ skill }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: '-20px' });
  const IconComponent = getCategoryIcon(skill.category);

  return (
    <Motion.div
      ref={cardRef}
      variants={cardVariants}
      className="group relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/80 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-zinc-950/40"
    >
      {/* Subtle hover radial glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-zinc-500/5 blur-2xl" />
      </div>

      <div className="relative flex items-center gap-3">
        {/* Logo / Icon container */}
        {skill.logo ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-950/80 p-1.5">
            <img
              src={skill.logo}
              alt={skill.skill}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800/60 bg-zinc-950/80">
            <IconComponent className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </div>
        )}

        {/* Skill Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors" title={skill.skill}>
            {skill.skill}
          </p>
          {skill.category ? (
            <p className="truncate text-xs text-zinc-500">{skill.category}</p>
          ) : null}
        </div>

        {/* Percentage */}
        <span className="shrink-0 text-sm font-bold tabular-nums text-zinc-300 group-hover:text-zinc-100 transition-colors">
          <AnimatedCounter value={skill.percentage} isInView={isInView} />%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-850">
        <Motion.div
          className="h-full rounded-full bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-300"
          initial={{ width: 0 }}
          animate={isInView ? { width: `${skill.percentage}%` } : { width: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
        />
      </div>
    </Motion.div>
  );
});

PremiumSkillCard.displayName = 'PremiumSkillCard';

const AnimatedCounter = memo(({ value, isInView }) => {
  const ref = useRef(null);

  return (
    <Motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isInView ? <CountUp target={value} /> : 0}
    </Motion.span>
  );
});

AnimatedCounter.displayName = 'AnimatedCounter';

const CountUp = memo(({ target }) => {
  const nodeRef = useRef(null);
  const startedRef = useRef(false);

  const startAnimation = () => {
    if (startedRef.current || !nodeRef.current) return;
    startedRef.current = true;

    const duration = 1000;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      if (nodeRef.current) {
        nodeRef.current.textContent = current;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  return (
    <span
      ref={(el) => {
        nodeRef.current = el;
        if (el) startAnimation();
      }}
    >
      0
    </span>
  );
});

CountUp.displayName = 'CountUp';

const SkillsTechStack = () => {
  const { data, isLoading } = useSkillsQuery();
  const dbSkills = data?.items || [];
  const skillsToRender = dbSkills.length > 0 ? dbSkills : DEFAULT_SKILLS;

  return (
    <Motion.div variants={itemAnimation} className="w-full mb-8">
      <h2 className="text-sm font-semibold text-zinc-100 mb-4 uppercase tracking-wider">Skills & Tech Stack</h2>
      
      {isLoading && dbSkills.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded-xl border border-zinc-800/80 bg-zinc-950/40" />
          ))}
        </div>
      ) : (
        <Motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {skillsToRender.map((skill) => (
            <PremiumSkillCard key={skill._id || skill.skill} skill={skill} />
          ))}
        </Motion.div>
      )}
    </Motion.div>
  );
};

export default memo(SkillsTechStack);
