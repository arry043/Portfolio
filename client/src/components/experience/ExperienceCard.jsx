import { memo, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { formatExperiencePeriod } from '../../utils/date';

const cardAnimation = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const ExperienceCard = ({ experience, isActive, isInteractive }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Consider it active if it's currently focused by the timeline loop OR manually hovered
  const currentlyActive = isActive || isHovered;

  const handleInteractionStart = () => {
    if (isInteractive) setIsHovered(true);
  };

  const handleInteractionEnd = () => {
    if (isInteractive) setIsHovered(false);
  };

  return (
    <Motion.div 
      variants={cardAnimation}
      className="relative pl-10 sm:pl-14 w-full"
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      // For mobile tap interaction
      onClick={() => isInteractive && setIsHovered(!isHovered)}
    >
      {/* Timeline Node */}
      <div 
        className={`absolute left-[11px] sm:left-[19px] top-4 w-3 h-3 rounded-full -translate-x-[1px] transition-all duration-500 z-10 
          ${currentlyActive 
            ? 'bg-white shadow-[0_0_15px_rgba(59,130,246,0.8)] scale-125' 
            : 'bg-zinc-600 scale-100'
          }`}
      />

      {/* Experience Card */}
      <div 
        className={`
          bg-zinc-950/80 border rounded-lg p-3 sm:p-4 transition-all duration-300 relative overflow-hidden
          ${currentlyActive 
            ? 'border-blue-500/50 shadow-md shadow-blue-500/10 bg-zinc-900/90' 
            : 'border-zinc-800'
          }
        `}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
          <div>
            <h3 className={`text-base font-bold transition-colors duration-300 ${currentlyActive ? 'text-white' : 'text-zinc-200'}`}>
              {experience.role}
            </h3>
            <p className="text-sm font-medium text-zinc-400 mt-0.5">{experience.company}</p>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 whitespace-nowrap w-fit">
            {formatExperiencePeriod(experience)}
          </span>
        </div>

        <AnimatePresence>
          {currentlyActive && (
            <Motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-3 border-t border-zinc-800/50 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {experience.description || (experience.highlights && experience.highlights.join('\n'))}
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </Motion.div>
  );
};

export default memo(ExperienceCard);
