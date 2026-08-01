import { memo, useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Move,
  Target,
  Zap,
  ArrowRight,
  RotateCcw,
  List,
  Star,
} from 'lucide-react';
import { formatTime } from '../../lib/scoringEngine';

const GameCompleteModal = ({
  isOpen,
  score,
  time,
  moves,
  accuracy,
  grade,
  isPersonalBest,
  onPlayAgain,
  onShowLeaderboard,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animated score counter
  useEffect(() => {
    if (!isOpen) {
      setAnimatedScore(0);
      return;
    }

    const duration = 1200;
    const steps = 40;
    const increment = score / steps;
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), score);
      setAnimatedScore(current);

      if (step >= steps) {
        clearInterval(interval);
        setAnimatedScore(score);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [isOpen, score]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          id="game-complete-overlay"
        >
          <Motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50"
            id="game-complete-modal"
          >
            {/* Header */}
            <div className="border-b border-zinc-800 px-5 py-4 text-center">
              <div className="mx-auto mb-2 inline-flex rounded-full border border-zinc-700 bg-zinc-900 p-2.5">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                Session Complete
              </h2>
              {isPersonalBest && (
                <Motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400"
                >
                  <Star className="h-3 w-3" />
                  New Personal Best!
                </Motion.div>
              )}
            </div>

            {/* Score */}
            <div className="border-b border-zinc-800 px-5 py-5 text-center">
              <Motion.p
                className="text-4xl font-bold tabular-nums text-zinc-100"
                key={animatedScore}
              >
                {animatedScore.toLocaleString()}
              </Motion.p>
              <p className="mt-1 text-xs text-zinc-500">
                Grade: <span className="font-semibold text-zinc-300">{grade}</span>
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 divide-x divide-zinc-800 border-b border-zinc-800">
              <div className="px-3 py-3 text-center">
                <Clock className="mx-auto mb-1 h-3.5 w-3.5 text-zinc-500" />
                <p className="text-sm font-semibold tabular-nums text-zinc-200">
                  {formatTime(time)}
                </p>
                <p className="text-[10px] text-zinc-600">Time</p>
              </div>
              <div className="px-3 py-3 text-center">
                <Move className="mx-auto mb-1 h-3.5 w-3.5 text-zinc-500" />
                <p className="text-sm font-semibold tabular-nums text-zinc-200">
                  {moves}
                </p>
                <p className="text-[10px] text-zinc-600">Moves</p>
              </div>
              <div className="px-3 py-3 text-center">
                <Target className="mx-auto mb-1 h-3.5 w-3.5 text-zinc-500" />
                <p className="text-sm font-semibold tabular-nums text-zinc-200">
                  {accuracy}%
                </p>
                <p className="text-[10px] text-zinc-600">Accuracy</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 px-5 py-4">
              <button
                onClick={onPlayAgain}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black shadow-md transition-colors duration-200 hover:bg-gray-200"
                id="play-again-btn"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Play Again
              </button>

              <button
                onClick={onShowLeaderboard}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors duration-200 hover:bg-zinc-800 hover:text-zinc-100"
                id="show-leaderboard-btn"
              >
                <List className="h-3.5 w-3.5" />
                Leaderboard
              </button>

              <Link
                to="/labs"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 transition-colors duration-200 hover:text-zinc-300"
                id="back-to-labs-complete"
              >
                Back to Labs
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(GameCompleteModal);
