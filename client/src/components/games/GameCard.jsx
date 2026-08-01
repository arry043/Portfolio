import { memo } from 'react';
import { motion as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain,
  Keyboard,
  Grid3x3,
  Zap,
  ArrowRight,
  Trophy,
  User,
  LogIn,
} from 'lucide-react';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from '../../lib/gameRegistry';
import useGameStore from '../../store/useGameStore';
import useAuthStore from '../../store/useAuthStore';
import memorizationLogo from '../../assets/memorization-logo.png';

const ICON_MAP = {
  Brain,
  Keyboard,
  Grid3x3,
  Zap,
};

const GameCard = ({ game, index = 0 }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const getGameBestScores = useGameStore((s) => s.getGameBestScores);
  const bestScores = getGameBestScores(game.slug);
  const IconComponent = ICON_MAP[game.icon] || Brain;
  const isMemorizationGame = game.slug === 'memorization';

  // Find overall best score across difficulties
  const overallBest = Object.values(bestScores).reduce(
    (best, entry) => (entry?.score > (best?.score || 0) ? entry : best),
    null
  );

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
    >
      <Link
        to={game.path}
        className="group block"
        id={`game-card-${game.slug}`}
      >
        <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 sm:p-6 transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-black/30">
          {isMemorizationGame && (
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-[72%] overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to right, transparent, black 42%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 42%)',
              }}
            >
              <img
                src={memorizationLogo}
                alt=""
                aria-hidden="true"
                className="absolute -right-10 top-1/2 h-[260px] w-[260px] -translate-y-1/2 object-cover opacity-60 transition-all duration-500 group-hover:scale-105 group-hover:opacity-80"
              />
            </div>
          )}

          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/0 to-zinc-800/0 transition-all duration-500 group-hover:from-zinc-800/5 group-hover:to-zinc-700/5" />

          <div className="relative space-y-4">
            {/* Header: Icon + Status */}
            <div className="flex items-start justify-between">
              <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 transition-colors duration-300 group-hover:border-zinc-700 group-hover:bg-zinc-800">
                <IconComponent className="h-5 w-5 text-zinc-300" />
              </div>

              <div className="flex items-center gap-1.5">
                {isAuthenticated ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                    <User className="h-3 w-3" />
                    Synced
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700/60 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                    <LogIn className="h-3 w-3" />
                    Guest
                  </span>
                )}
              </div>
            </div>

            {/* Title + Description */}
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold tracking-tight text-zinc-100 sm:text-lg">
                {game.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500 line-clamp-2">
                {game.description}
              </p>
            </div>

            {/* Difficulty badges */}
            <div className="flex flex-wrap gap-1.5">
              {game.difficulties.map((diff) => (
                <span
                  key={diff}
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${DIFFICULTY_COLORS[diff]}`}
                >
                  {DIFFICULTY_LABELS[diff]}
                </span>
              ))}
            </div>

            {/* Best score + Play action */}
            <div className="flex items-center justify-between pt-1">
              {overallBest ? (
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-sm font-medium text-zinc-300">
                    {overallBest.score.toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-600">best</span>
                </div>
              ) : (
                <span className="text-xs text-zinc-600">No score yet</span>
              )}

              <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-400 transition-colors duration-200 group-hover:text-zinc-200">
                Play
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Motion.div>
  );
};

export default memo(GameCard);
