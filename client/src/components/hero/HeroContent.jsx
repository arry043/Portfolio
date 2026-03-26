import { memo } from 'react';
import { motion as Motion } from 'framer-motion';
import CTAButtons from './CTAButtons';
import ModeSwitcher from './ModeSwitcher';
import RoleRotator from './RoleRotator';

const containerAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      staggerChildren: 0.1,
    },
  },
};

const itemAnimation = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const HeroContent = ({ name, mode, onModeChange }) => {
  const dynamicRoles = [
    "Full Stack Developer",
    "Backend Developer",
    "AI/ML Engineer"
  ];

  return (
    <Motion.div
      variants={containerAnimation}
      initial="hidden"
      animate="visible"
      className="space-y-1 flex flex-col items-center lg:items-start text-center lg:text-left justify-center"
    >
      <Motion.div
        variants={itemAnimation}
        className="mb-4 inline-flex items-center rounded-full border border-zinc-800/90 bg-zinc-950/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400"
      >
        Available For Product Builds
      </Motion.div>

      <Motion.h1
        variants={itemAnimation}
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight"
      >
        {name}
      </Motion.h1>

      <Motion.div variants={itemAnimation} className="mt-2 space-y-3 flex flex-col items-center lg:items-start w-full">
        <RoleRotator key={mode} mode={mode} roles={dynamicRoles} />
        <ModeSwitcher mode={mode} onModeChange={onModeChange} />
      </Motion.div>

      <Motion.p
        variants={itemAnimation}
        className="text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed mt-3"
      >
        Full Stack Developer (MERN + Django) with strong backend expertise, AI integration, and performance-focused architecture. Passionate about building scalable products and real-world solutions.
      </Motion.p>

      <Motion.div variants={itemAnimation} className="mt-5 flex justify-center lg:justify-start w-full">
        <CTAButtons />
      </Motion.div>
    </Motion.div>
  );
};

export default memo(HeroContent);
