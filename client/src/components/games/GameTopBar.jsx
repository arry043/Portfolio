import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';
import { DIFFICULTY_LABELS } from '../../lib/gameRegistry';

const GameTopBar = ({
  gameTitle,
  difficulty,
  status,
  onDifficultyChange,
  onPause,
  onResume,
  onRestart,
}) => {
  const difficulties = ['easy', 'medium', 'hard', 'expert'];
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';
  const canChangeDifficulty = isIdle;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-3">
        <Link
          to="/labs"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
          id="back-to-labs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Labs</span>
        </Link>
        <h1 className="text-base font-semibold tracking-tight text-zinc-100 sm:text-lg">
          {gameTitle}
        </h1>
      </div>

      {/* Center: Difficulty Selector */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950/80 p-0.5">
        {difficulties.map((diff) => (
          <button
            key={diff}
            onClick={() => canChangeDifficulty && onDifficultyChange(diff)}
            disabled={!canChangeDifficulty}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
              difficulty === diff
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : canChangeDifficulty
                  ? 'text-zinc-500 hover:text-zinc-300'
                  : 'cursor-not-allowed text-zinc-700'
            }`}
            id={`difficulty-${diff}`}
          >
            {DIFFICULTY_LABELS[diff]}
          </button>
        ))}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {(isPlaying || isPaused) && (
          <button
            onClick={isPaused ? onResume : onPause}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
            id="pause-resume-btn"
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pause</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
          id="restart-btn"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Restart</span>
        </button>
      </div>
    </div>
  );
};

export default memo(GameTopBar);
