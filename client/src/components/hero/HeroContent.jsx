import { memo } from 'react';
import { motion as Motion } from 'framer-motion';
import CTAButtons from './CTAButtons';
import ModeSwitcher from './ModeSwitcher';
import RoleRotator from './RoleRotator';

const containerAnimation = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
      staggerChildren: 0.08,
    },
  },
};

const itemAnimation = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const HeroContent = ({ name, tagline, summary, mode, roles, onModeChange }) => {
  return (
    <Motion.div
      variants={containerAnimation}
      initial="hidden"
      animate="visible"
      className="space-y-4 text-center lg:text-left"
    >
      <Motion.div
        variants={itemAnimation}
        className="inline-flex items-center rounded-full border border-zinc-800/90 bg-zinc-950/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400"
      >
        Available For Product Builds
      </Motion.div>

      <Motion.h1
        variants={itemAnimation}
        className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl"
      >
        {name}
        <span className="block text-zinc-400">{tagline}</span>
      </Motion.h1>

      <Motion.p
        variants={itemAnimation}
        className="mx-auto max-w-xl text-sm leading-relaxed text-zinc-400 lg:mx-0"
      >
        {summary}
      </Motion.p>

      <Motion.div variants={itemAnimation} className="space-y-3">
        <ModeSwitcher mode={mode} onModeChange={onModeChange} />
        <RoleRotator key={mode} mode={mode} roles={roles} />
      </Motion.div>

      <Motion.div variants={itemAnimation}>
        <CTAButtons />
      </Motion.div>
    </Motion.div>
  );
};

export default memo(HeroContent);
