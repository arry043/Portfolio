import { memo } from 'react';
import { Gamepad2 } from 'lucide-react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import EmptyState from '../common/EmptyState';
import GameCard from '../games/GameCard';
import { getAvailableGames } from '../../lib/gameRegistry';
import { useTrackSectionView } from '../../hooks/useTrackEvent';

const GameSection = () => {
  useTrackSectionView('labs', {
    viewType: 'game-library',
    viewEndpoint: '/analytics/event',
    dedupeInSession: true,
  });

  const games = getAvailableGames();

  return (
    <SectionWrapper id="labs" bgVariant="secondary" className="py-10 sm:py-12">
      <Container>
        <div className="space-y-6">
          <SectionHeader
            eyebrow="Labs"
            title="Developer Game Library"
            description="Interactive challenges built with the same stack that powers this portfolio. Test your skills and climb the leaderboard."
          />

          {games.length === 0 ? (
            <EmptyState
              message="No Games Available"
              description="Game entries will appear here once available."
              icon={Gamepad2}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((game, index) => (
                <GameCard key={game.slug} game={game} index={index} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(GameSection);
