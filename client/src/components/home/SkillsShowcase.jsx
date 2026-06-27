import { memo, useRef } from 'react';
import { motion as Motion, useInView } from 'framer-motion';
import SectionSkeleton from '../common/SectionSkeleton';
import EmptyState from '../common/EmptyState';
import { Sparkles } from 'lucide-react';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

const SkillCard = memo(({ skill }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: '-40px' });

  return (
    <Motion.div
      ref={cardRef}
      variants={cardVariants}
      className="group relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/80 hover:bg-zinc-900/60 hover:shadow-lg hover:shadow-zinc-950/40"
    >
      {/* Hover glow effect */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-zinc-500/5 blur-2xl" />
      </div>

      <div className="relative flex items-center gap-3">
        {/* Logo */}
        {skill.logo ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-1.5">
            <img
              src={skill.logo}
              alt={skill.skill}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800/60 bg-zinc-950/60">
            <Sparkles className="h-4 w-4 text-zinc-600" />
          </div>
        )}

        {/* Name & Category */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100" title={skill.skill}>
            {skill.skill}
          </p>
          {skill.category ? (
            <p className="truncate text-xs text-zinc-500">{skill.category}</p>
          ) : null}
        </div>

        {/* Percentage counter */}
        <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-300">
          <AnimatedCounter value={skill.percentage} isInView={isInView} />%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800/80">
        <Motion.div
          className="h-full rounded-full bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-300"
          initial={{ width: 0 }}
          animate={isInView ? { width: `${skill.percentage}%` } : { width: 0 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </Motion.div>
  );
});

SkillCard.displayName = 'SkillCard';

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

const SkillsShowcase = ({ skills = [], isLoading = false }) => {
  if (isLoading) {
    return <SectionSkeleton cardCount={4} />;
  }

  if (skills.length === 0) {
    return (
      <EmptyState
        message="No Skill Highlights"
        description="Skills will appear here once available."
        icon={Sparkles}
        className="min-h-28"
      />
    );
  }

  return (
    <Motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {skills.map((skill) => (
        <SkillCard key={skill._id || skill.skill} skill={skill} />
      ))}
    </Motion.div>
  );
};

export default memo(SkillsShowcase);
