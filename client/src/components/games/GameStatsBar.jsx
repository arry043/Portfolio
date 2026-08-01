import { memo } from 'react';
import { Clock, Move, Target, Zap } from 'lucide-react';
import { formatTime } from '../../lib/scoringEngine';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '../../lib/gameRegistry';

const StatItem = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <Icon className="h-3.5 w-3.5 text-zinc-500" />
    <div className="flex items-baseline gap-1">
      <span className="text-sm font-semibold text-zinc-200 tabular-nums">
        {value}
      </span>
      <span className="hidden text-[10px] text-zinc-600 sm:inline">{label}</span>
    </div>
  </div>
);

const GameStatsBar = ({ elapsedTime, moves, accuracy, score, difficulty }) => {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 sm:gap-5 sm:px-5 sm:py-2.5"
      id="game-stats-bar"
    >
      <StatItem icon={Clock} label="Time" value={formatTime(elapsedTime)} />

      <div className="h-4 w-px bg-zinc-800" />

      <StatItem icon={Move} label="Moves" value={moves} />

      <div className="h-4 w-px bg-zinc-800" />

      <StatItem icon={Target} label="Accuracy" value={`${accuracy}%`} />

      <div className="h-4 w-px bg-zinc-800" />

      <StatItem icon={Zap} label="Score" value={score.toLocaleString()} />

      <div className="hidden h-4 w-px bg-zinc-800 sm:block" />

      <span
        className={`hidden rounded-md border px-2 py-0.5 text-[10px] font-medium sm:inline ${DIFFICULTY_COLORS[difficulty]}`}
      >
        {DIFFICULTY_LABELS[difficulty]}
      </span>
    </div>
  );
};

export default memo(GameStatsBar);
