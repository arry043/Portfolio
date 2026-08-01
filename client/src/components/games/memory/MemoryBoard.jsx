import { memo, useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import MemoryCard from './MemoryCard';

const GRID_CONFIGS = {
  easy: { cols: 4, rows: 4, size: 'small' },
  medium: { cols: 6, rows: 4, size: 'medium' },
  hard: { cols: 6, rows: 6, size: 'large' },
  expert: { cols: 8, rows: 8, size: 'xlarge' },
};

const MemoryBoard = ({ cards, difficulty, onCardFlip, isDisabled }) => {
  const config = GRID_CONFIGS[difficulty] || GRID_CONFIGS.easy;

  const gridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
      gap: config.size === 'xlarge' ? '6px' : config.size === 'large' ? '8px' : '10px',
    }),
    [config.cols, config.size]
  );

  const handleFlip = (cardId) => {
    if (isDisabled) return;
    onCardFlip(cardId);
  };

  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto w-fit"
    >
      <div
        className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-3 sm:p-4"
        style={gridStyle}
        id="memory-board"
      >
        {cards.map((card) => (
          <MemoryCard
            key={card.id}
            card={card}
            onClick={handleFlip}
            gridSize={config.size}
          />
        ))}
      </div>
    </Motion.div>
  );
};

export default memo(MemoryBoard);
