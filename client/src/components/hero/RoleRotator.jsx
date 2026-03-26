import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';

const ROTATION_DELAY_MS = 2600;
const FALLBACK_ROLE = 'Adaptive Developer';

const roleAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const RoleRotator = ({ mode, roles }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const safeRoles = useMemo(() => {
    return Array.isArray(roles) && roles.length > 0 ? roles : [FALLBACK_ROLE];
  }, [roles]);

  useEffect(() => {
    if (isPaused || safeRoles.length < 2) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % safeRoles.length);
    }, ROTATION_DELAY_MS);

    return () => window.clearInterval(intervalId);
  }, [isPaused, safeRoles.length, mode]);

  const activeRole = safeRoles[activeIndex] ?? FALLBACK_ROLE;

  return (
    <div
      className="inline-flex min-h-10 items-center overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-950/60 px-4 py-2 text-base sm:text-lg text-zinc-300 font-medium"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <Motion.span
          key={`${mode}-${activeIndex}-${activeRole}`}
          variants={roleAnimation}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="block max-w-[16rem] overflow-hidden text-ellipsis whitespace-nowrap sm:max-w-none sm:whitespace-normal sm:break-words"
          title={activeRole}
        >
          {activeRole}
        </Motion.span>
      </AnimatePresence>
    </div>
  );
};

export default memo(RoleRotator);
