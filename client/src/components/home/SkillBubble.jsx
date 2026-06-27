import { memo } from 'react';
import { motion as Motion } from 'framer-motion';

const FALLBACK_LOGO = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=80&q=80';

const SkillBubble = ({
  skill,
  size,
  isHovered,
  isDragged,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onTouchStart,
  style,
  innerRef,
}) => {
  const logoUrl = skill.logo || FALLBACK_LOGO;
  const percentage = skill.percentage ?? 50;

  // Determine glow intensity and color based on proficiency level
  const glowColor =
    percentage >= 90
      ? 'rgba(16, 185, 129, 0.4)' // Strong green for experts
      : percentage >= 70
      ? 'rgba(16, 185, 129, 0.25)' // Medium green
      : 'rgba(16, 185, 129, 0.15)'; // Soft green

  return (
    <div
      ref={innerRef}
      style={{
        ...style,
        width: size,
        height: size,
        cursor: isDragged ? 'grabbing' : 'grab',
      }}
      className="absolute touch-none select-none rounded-full flex items-center justify-center transition-shadow duration-300"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={onClick}
    >
      <Motion.div
        animate={{
          scale: isHovered ? 1.08 : 1,
          boxShadow: isHovered
            ? `0 0 25px ${glowColor}, inset 0 2px 8px rgba(255, 255, 255, 0.07)`
            : `0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 4px rgba(255, 255, 255, 0.05)`,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{
          width: '100%',
          height: '100%',
        }}
        className="relative rounded-full border border-zinc-800 bg-zinc-950/80 backdrop-blur-md overflow-hidden flex items-center justify-center"
      >
        {/* Glass reflection effect */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.04] to-transparent rounded-t-full" />
        
        {/* Liquid background tracker (grayscale) */}
        <div className="absolute inset-2 select-none flex items-center justify-center opacity-25">
          <img
            src={logoUrl}
            alt=""
            className="max-w-full max-h-full object-contain filter grayscale contrast-125"
            draggable={false}
          />
        </div>

        {/* Liquid fill overlay (colored and clipped from bottom) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            clipPath: `inset(${100 - percentage}% 0px 0px 0px)`,
          }}
        >
          {/* Subtle liquid color back-glow inside bubble */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent" />
          
          <div className="absolute inset-2 select-none flex items-center justify-center">
            <img
              src={logoUrl}
              alt={skill.skill}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
        </div>

        {/* Liquid surface line shimmer */}
        {percentage > 0 && percentage < 100 && (
          <div
            className="absolute inset-x-0 h-0.5 bg-emerald-400/30 blur-[0.5px]"
            style={{
              bottom: `${percentage}%`,
            }}
          />
        )}

        {/* Subtle circular boundary ring highlight */}
        <div className="absolute inset-0 rounded-full border border-emerald-500/5 pointer-events-none group-hover:border-emerald-500/15 transition-colors" />
      </Motion.div>
    </div>
  );
};

export default memo(SkillBubble);
