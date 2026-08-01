import { memo, useState, useCallback, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import PageTransition from '../components/layout/PageTransition';
import Container from '../components/layout/Container';
import GameTopBar from '../components/games/GameTopBar';
import GameStatsBar from '../components/games/GameStatsBar';
import MemoryBoard from '../components/games/memory/MemoryBoard';
import GameCompleteModal from '../components/games/GameCompleteModal';
import LeaderboardPanel from '../components/games/LeaderboardPanel';
import useMemoryGame from '../hooks/useMemoryGame';
import { calculateScore } from '../lib/scoringEngine';
import useGameStore from '../store/useGameStore';

const GAME_SLUG = 'memorization';

const MemoryGamePage = () => {
  const game = useMemoryGame();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const getBestScore = useGameStore((s) => s.getBestScore);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show completion modal when game ends
  useEffect(() => {
    if (game.status === 'completed' && !showCompleteModal) {
      const scoreData = calculateScore({
        totalPairs: game.totalPairs,
        time: game.elapsedTime,
        wrongMatches: game.wrongMatches,
        hintsUsed: game.hintsUsed,
        difficulty: game.difficulty,
      });

      const previousBest = getBestScore(GAME_SLUG, game.difficulty);
      const isPersonalBest =
        !previousBest || scoreData.score >= previousBest.score;

      setCompletionData({
        score: scoreData.score,
        time: game.elapsedTime,
        moves: game.moves,
        accuracy: scoreData.accuracy,
        grade: scoreData.grade,
        isPersonalBest,
      });
      setShowCompleteModal(true);
    }
  }, [game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlayAgain = useCallback(() => {
    setShowCompleteModal(false);
    setCompletionData(null);
    game.restart();
  }, [game]);

  const handleShowLeaderboard = useCallback(() => {
    setShowCompleteModal(false);
    setShowLeaderboard(true);
  }, []);

  const toggleLeaderboard = useCallback(() => {
    setShowLeaderboard((prev) => !prev);
  }, []);

  // Pause overlay
  const isPaused = game.status === 'paused';

  return (
    <PageTransition className="pt-16">
      <div className="min-h-[calc(100vh-4rem)] bg-dark-secondary">
        <Container className="py-4 sm:py-6">
          <div className="space-y-4 sm:space-y-5">
            {/* Top Bar */}
            <GameTopBar
              gameTitle="Memorization"
              difficulty={game.difficulty}
              status={game.status}
              onDifficultyChange={game.changeDifficulty}
              onPause={game.pause}
              onResume={game.resume}
              onRestart={game.restart}
            />

            {/* Stats Bar */}
            <GameStatsBar
              elapsedTime={game.elapsedTime}
              moves={game.moves}
              accuracy={game.accuracy}
              score={game.currentScore}
              difficulty={game.difficulty}
            />

            {/* Main Content: Board + Leaderboard */}
            <div className="flex flex-col items-start gap-4 lg:flex-row lg:justify-center">
              {/* Game Board */}
              <div className="relative flex-1 flex justify-center">
                <MemoryBoard
                  cards={game.cards}
                  difficulty={game.difficulty}
                  onCardFlip={game.flipCard}
                  isDisabled={isPaused || game.status === 'completed'}
                />

                {/* Pause Overlay */}
                {isPaused && (
                  <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm"
                  >
                    <div className="text-center">
                      <p className="text-lg font-semibold text-zinc-200">
                        Paused
                      </p>
                      <button
                        onClick={game.resume}
                        className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black shadow-md transition-colors hover:bg-gray-200"
                        id="resume-overlay-btn"
                      >
                        Resume
                      </button>
                    </div>
                  </Motion.div>
                )}
              </div>

              {/* Leaderboard Toggle (Mobile) */}
              {isMobile && (
                <button
                  onClick={toggleLeaderboard}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                  id="toggle-leaderboard-mobile"
                >
                  {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
                </button>
              )}

              {/* Leaderboard (Desktop: side panel) */}
              {!isMobile && (
                <div className="hidden lg:block">
                  <button
                    onClick={toggleLeaderboard}
                    className="mb-2 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
                    id="toggle-leaderboard-desktop"
                  >
                    {showLeaderboard ? 'Hide' : 'Leaderboard'}
                  </button>
                  <LeaderboardPanel
                    gameSlug={GAME_SLUG}
                    isOpen={showLeaderboard}
                    onClose={() => setShowLeaderboard(false)}
                    isMobile={false}
                  />
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile Leaderboard Drawer */}
      {isMobile && (
        <LeaderboardPanel
          gameSlug={GAME_SLUG}
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          isMobile={true}
        />
      )}

      {/* Completion Modal */}
      <GameCompleteModal
        isOpen={showCompleteModal}
        score={completionData?.score || 0}
        time={completionData?.time || 0}
        moves={completionData?.moves || 0}
        accuracy={completionData?.accuracy || 0}
        grade={completionData?.grade || 'D'}
        isPersonalBest={completionData?.isPersonalBest || false}
        onPlayAgain={handlePlayAgain}
        onShowLeaderboard={handleShowLeaderboard}
      />
    </PageTransition>
  );
};

export default memo(MemoryGamePage);
