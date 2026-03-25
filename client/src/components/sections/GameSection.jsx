import { memo, useEffect } from 'react';
import { Gamepad2, Rocket } from 'lucide-react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Card from '../ui/Card';
import SectionHeader from '../common/SectionHeader';
import SectionSkeleton from '../common/SectionSkeleton';
import EmptyState from '../common/EmptyState';
import { useGamesQuery } from '../../hooks/usePortfolioApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import { useTrackSectionView } from '../../hooks/useTrackEvent';

const GameSection = () => {
  const gamesQuery = useGamesQuery();
  const toast = useToast();
  useTrackSectionView('games');

  useEffect(() => {
    if (gamesQuery.isError) {
      toast.error(getErrorMessage(gamesQuery.error), 'Games Fetch Failed');
    }
  }, [gamesQuery.error, gamesQuery.isError, toast]);

  const games = gamesQuery.data?.items || [];

  return (
    <SectionWrapper id="games" bgVariant="secondary" className="py-10 sm:py-12">
      <Container>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="Interactive"
            title="Game Lab"
            description="Games are loaded from backend data with a safe fallback UI."
          />

          {gamesQuery.isLoading ? (
            <SectionSkeleton cardCount={2} />
          ) : games.length === 0 ? (
            <EmptyState
              message="No Games Found!"
              description="Game entries will be visible once backend data is available."
              icon={Gamepad2}
            />
          ) : (
            <Card className="border-zinc-800 bg-zinc-950/75 p-3 sm:p-4" hoverEffect={false}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {games.map((game, index) => (
                  <div
                    key={`${game?.title || 'game'}-${index}`}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3"
                  >
                    <div className="mb-2 inline-flex rounded-md border border-zinc-800 bg-zinc-950 p-2">
                      {index % 2 === 0 ? (
                        <Gamepad2 className="h-4 w-4 text-zinc-300" />
                      ) : (
                        <Rocket className="h-4 w-4 text-zinc-300" />
                      )}
                    </div>
                    <p className="truncate text-sm font-semibold text-zinc-100" title={game?.title || 'Game'}>
                      {game?.title || 'Untitled Game'}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {game?.description || 'Game details will be available soon.'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(GameSection);
