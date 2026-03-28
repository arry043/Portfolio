import { memo, useEffect, useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import ExperienceCard from './ExperienceCard';
import EmptyState from '../common/EmptyState';

const ANIMATION_DURATION_MS = 6000;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const ExperienceTimeline = ({ experiences = [] }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);

  const timelineExperiences = useMemo(
    () => (Array.isArray(experiences) ? experiences.filter(Boolean) : []),
    [experiences]
  );

  const resolvedActiveIndex =
    timelineExperiences.length === 1 ? 0 : isHoveringTimeline ? -1 : activeIndex;

  useEffect(() => {
    // If empty/1 item, no need to loop active index.
    if (timelineExperiences.length <= 1 || isHoveringTimeline) {
      return;
    }

    const sliceDuration = ANIMATION_DURATION_MS / timelineExperiences.length;
    const startedAt = Date.now();

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) % ANIMATION_DURATION_MS;
      const currentIndex = Math.floor(elapsed / sliceDuration);
      setActiveIndex(currentIndex);
    }, 100);

    return () => clearInterval(interval);
  }, [timelineExperiences.length, isHoveringTimeline]);

  if (timelineExperiences.length === 0) {
    return (
      <EmptyState
        message="No Experience Data"
        description="Experience entries will appear here once available."
      />
    );
  }

  return (
    <div 
      className="max-w-5xl mx-auto px-4 w-full"
      onMouseEnter={() => setIsHoveringTimeline(true)}
      onMouseLeave={() => setIsHoveringTimeline(false)}
      onTouchStart={() => setIsHoveringTimeline(true)}
      onTouchEnd={() => setIsHoveringTimeline(false)}
    >
      <Motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="flex flex-col gap-6 relative py-4"
      >
        {/* Background Static Line */}
        <div className="absolute left-4 sm:left-6 lg:left-[88px] top-0 bottom-0 w-[2px] bg-zinc-800 rounded-full overflow-hidden">
          {/* Animated Glowing Line overlaid on the static line */}
          {timelineExperiences.length > 1 && !isHoveringTimeline && (
            <Motion.div 
              className="absolute left-0 right-0 w-full h-[30%] bg-gradient-to-b from-transparent via-blue-500 to-purple-500 rounded-full"
              animate={{ 
                top: ['-30%', '100%'],
                opacity: [0, 1, 1, 0]
              }}
              transition={{ 
                duration: ANIMATION_DURATION_MS / 1000, 
                ease: 'linear',
                repeat: Infinity 
              }}
            />
          )}
          {/* Fallback solid active line if single experience or hovering */}
          {(timelineExperiences.length <= 1 || isHoveringTimeline) && (
            <div className="absolute left-0 right-0 top-0 bottom-0 w-full bg-zinc-700/50 transition-opacity duration-300" />
          )}
        </div>

        {/* Experience Cards */}
        {timelineExperiences.map((exp, index) => (
          <ExperienceCard 
            key={`${exp.company}-${exp.role}-${index}`} 
            experience={exp} 
            isActive={index === resolvedActiveIndex}
            isInteractive={true}
          />
        ))}
      </Motion.div>
    </div>
  );
};

export default memo(ExperienceTimeline);
