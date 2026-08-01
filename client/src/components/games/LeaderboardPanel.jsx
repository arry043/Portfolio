import { memo, useCallback, useRef, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Clock,
  X,
  LogIn,
  ChevronDown,
  Medal,
  User as UserIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLeaderboard } from '../../hooks/useGameApi';
import { DIFFICULTY_LABELS } from '../../lib/gameRegistry';
import { formatTime } from '../../lib/scoringEngine';
import useAuthStore from '../../store/useAuthStore';

const TABS = ['easy', 'medium', 'hard', 'expert', 'overall'];

const RANK_COLORS = {
  1: 'text-amber-400',
  2: 'text-zinc-300',
  3: 'text-amber-600',
};

const LeaderboardPanel = ({ gameSlug, isOpen, onOpen, onClose, isMobile = false }) => {
  const [activeTab, setActiveTab] = useState('easy');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.user);
  const listRef = useRef(null);

  const difficulty = activeTab === 'overall' ? undefined : activeTab;
  const { data, isLoading } = useLeaderboard(gameSlug, activeTab);

  const entries = data?.entries || [];

  // Limit to top 3 for guests
  const visibleEntries = isAuthenticated ? entries : entries.slice(0, 3);
  const hasMoreEntries = !isAuthenticated && entries.length > 3;

  // Find current user's entry index
  const currentUserIndex = isAuthenticated && currentUser
    ? entries.findIndex(
        (e) => e.userId && String(e.userId) === String(currentUser._id)
      )
    : -1;

  const scrollToMyRank = useCallback(() => {
    if (currentUserIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-rank-item]');
      if (items[currentUserIndex]) {
        items[currentUserIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentUserIndex]);

  const content = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Leaderboard</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          id="close-leaderboard"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-2 text-[10px] font-medium transition-colors sm:text-xs ${
              activeTab === tab
                ? 'border-b-2 border-zinc-300 text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
            id={`leaderboard-tab-${tab}`}
          >
            {tab === 'overall' ? 'Overall' : DIFFICULTY_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto" ref={listRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Trophy className="mx-auto mb-2 h-6 w-6 text-zinc-700" />
            <p className="text-sm text-zinc-500">No scores yet</p>
            <p className="text-xs text-zinc-600">Be the first to play!</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {visibleEntries.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser =
                isAuthenticated &&
                currentUser &&
                entry.userId &&
                String(entry.userId) === String(currentUser._id);

              return (
                <div
                  key={entry._id || index}
                  data-rank-item
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    isCurrentUser
                      ? 'bg-zinc-800/40 border-l-2 border-l-amber-500/50'
                      : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="flex w-7 items-center justify-center">
                    {rank <= 3 ? (
                      <Medal
                        className={`h-4 w-4 ${RANK_COLORS[rank] || 'text-zinc-500'}`}
                      />
                    ) : (
                      <span className="text-xs font-medium tabular-nums text-zinc-600">
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Player */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-zinc-300">
                        {entry.playerName || 'Guest'}
                      </p>
                      {isCurrentUser && (
                        <span className="shrink-0 rounded bg-zinc-700 px-1 text-[9px] font-bold text-zinc-300">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score + Time */}
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-sm font-semibold tabular-nums text-zinc-200">
                      {entry.score?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] tabular-nums text-zinc-600">
                      <Clock className="h-3 w-3" />
                      {formatTime(entry.time || 0)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Show current user rank if far down */}
            {isAuthenticated && currentUserIndex > visibleEntries.length - 1 && (
              <>
                <div className="px-4 py-1.5 text-center">
                  <span className="text-[10px] text-zinc-600">• • •</span>
                </div>
                <div className="flex items-center gap-3 bg-zinc-800/40 border-l-2 border-l-amber-500/50 px-4 py-2.5">
                  <div className="flex w-7 items-center justify-center">
                    <span className="text-xs font-medium tabular-nums text-zinc-400">
                      #{currentUserIndex + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-zinc-300">
                        {currentUser?.name || 'You'}
                      </p>
                      <span className="shrink-0 rounded bg-zinc-700 px-1 text-[9px] font-bold text-zinc-300">
                        YOU
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-sm font-semibold tabular-nums text-zinc-200">
                      {entries[currentUserIndex]?.score?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Guest CTA */}
            {hasMoreEntries && (
              <div className="px-4 py-4 text-center">
                <div className="mb-2 text-xs text-zinc-600">
                  +{entries.length - 3} more entries
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                >
                  <LogIn className="h-3 w-3" />
                  Login to see full leaderboard
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Show My Rank button */}
      {isAuthenticated && currentUserIndex >= 0 && (
        <div className="border-t border-zinc-800 px-4 py-2.5">
          <button
            onClick={scrollToMyRank}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            id="show-my-rank"
          >
            <UserIcon className="h-3 w-3" />
            Show My Rank (#{currentUserIndex + 1})
          </button>
        </div>
      )}
    </div>
  );

  // Mobile: slide-up drawer
  if (isMobile) {
    return (
      <>
        {!isOpen && (
          <Motion.button
            type="button"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.y < -36) onOpen?.();
            }}
            onClick={onOpen}
            className="fixed inset-x-0 bottom-0 z-30 flex h-10 touch-none items-center justify-center border-t border-zinc-800 bg-zinc-950/95"
            aria-label="Open leaderboard"
            id="leaderboard-pull-handle"
          >
            <span className="h-1 w-10 rounded-full bg-zinc-600" />
          </Motion.button>
        )}

        <AnimatePresence>
          {isOpen && (
            <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={onClose}
            />
            <Motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-zinc-950"
              id="leaderboard-drawer"
            >
              {/* Drag handle */}
              <Motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 80) onClose();
                }}
                className="flex justify-center pb-2 pt-3 touch-none"
              >
                <div className="h-1 w-8 rounded-full bg-zinc-700" />
              </Motion.div>
              {content}
            </Motion.div>
          </>
        )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: side panel
  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="h-fit max-h-[calc(100vh-12rem)] w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-xl shadow-black/30 lg:w-80"
          id="leaderboard-panel"
        >
          {content}
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(LeaderboardPanel);
