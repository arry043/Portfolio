import { memo, useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { getTechIcon } from './techIconRegistry';

const MemoryCard = ({ card, onClick, gridSize }) => {
  const isRevealed = card.isFlipped || card.isMatched;
  const icon = getTechIcon(card.tech);
  const [isIconUnavailable, setIsIconUnavailable] = useState(false);

  useEffect(() => {
    setIsIconUnavailable(false);
  }, [icon]);

  // Responsive card sizing based on grid size
  const sizeClasses = {
    small: 'h-16 w-16 sm:h-20 sm:w-20 text-[10px] sm:text-xs',     // 4x4
    medium: 'h-14 w-14 sm:h-16 sm:w-16 text-[9px] sm:text-[11px]',  // 6x4
    large: 'h-12 w-12 sm:h-14 sm:w-14 text-[9px] sm:text-[10px]',   // 6x6
    xlarge: 'h-10 w-10 sm:h-12 sm:w-12 text-[8px] sm:text-[9px]',   // 8x8
  };

  const cardSize = sizeClasses[gridSize] || sizeClasses.small;

  return (
    <Motion.button
      onClick={() => onClick(card.id)}
      className={`relative rounded-lg transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 ${cardSize} ${
        card.isMatched
          ? 'cursor-default'
          : 'cursor-pointer hover:shadow-md hover:shadow-black/20'
      }`}
      whileHover={!isRevealed ? { scale: 1.05 } : {}}
      whileTap={!isRevealed ? { scale: 0.95 } : {}}
      style={{ perspective: 600 }}
      aria-label={isRevealed ? `${card.tech} card` : 'Hidden card'}
      id={`memory-card-${card.id}`}
    >
      <Motion.div
        className="relative h-full w-full"
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Back face (hidden state) */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-lg border transition-colors duration-300 ${
            isRevealed
              ? 'border-transparent'
              : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/80'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg text-zinc-600">?</span>
          </div>
        </div>

        {/* Front face (revealed state) */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-lg border p-1 ${
            card.isMatched
              ? 'border-emerald-500/40 bg-emerald-500/10 shadow-sm shadow-emerald-500/10'
              : 'border-zinc-600 bg-zinc-800'
          }`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {icon && !isIconUnavailable ? (
            <img
              src={icon}
              alt={card.tech}
              loading="lazy"
              onError={() => setIsIconUnavailable(true)}
              className="h-[62%] w-[62%] max-h-full max-w-full object-contain"
            />
          ) : (
            <span
              className={`text-center font-semibold leading-tight ${
                card.isMatched ? 'text-emerald-300' : 'text-zinc-200'
              }`}
            >
              {card.tech}
            </span>
          )}
        </div>
      </Motion.div>
    </Motion.button>
  );
};

export default memo(MemoryCard);
