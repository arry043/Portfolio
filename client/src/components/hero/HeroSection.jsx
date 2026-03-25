import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import Container from '../layout/Container';
import SectionWrapper from '../layout/SectionWrapper';
import Card from '../ui/Card';
import HeroContent from './HeroContent';
import {
  DEFAULT_MODE,
  HERO_CONTENT,
  MODE_OPTIONS,
  getModeHighlights,
  getModeRoles,
  getValidatedMode,
} from './hero.constants';

const MODE_SWITCH_DEBOUNCE_MS = 130;

const HeroSection = ({ profile }) => {
  const [mode, setMode] = useState(DEFAULT_MODE);
  const modeSwitchTimerRef = useRef(null);

  const heroIdentity = useMemo(
    () => ({
      name: profile?.name || HERO_CONTENT.name,
      tagline: profile?.title || HERO_CONTENT.tagline,
      summary: profile?.summary || HERO_CONTENT.summary,
    }),
    [profile?.name, profile?.summary, profile?.title]
  );

  const activeMode = useMemo(() => getValidatedMode(mode), [mode]);
  const activeRoles = useMemo(() => getModeRoles(activeMode), [activeMode]);
  const activeHighlights = useMemo(
    () => getModeHighlights(activeMode),
    [activeMode]
  );

  const activeModeLabel = useMemo(() => {
    return (
      MODE_OPTIONS.find((option) => option.value === activeMode)?.label ??
      MODE_OPTIONS[0].label
    );
  }, [activeMode]);

  const handleModeChange = useCallback((nextMode) => {
    const safeMode = getValidatedMode(nextMode);

    if (modeSwitchTimerRef.current) {
      window.clearTimeout(modeSwitchTimerRef.current);
    }

    modeSwitchTimerRef.current = window.setTimeout(() => {
      setMode((previousMode) =>
        previousMode === safeMode ? previousMode : safeMode
      );
    }, MODE_SWITCH_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (modeSwitchTimerRef.current) {
        window.clearTimeout(modeSwitchTimerRef.current);
      }
    };
  }, []);

  return (
    <SectionWrapper
      id="home"
      bgVariant="hero"
      className="min-h-[calc(100vh-4rem)] pt-20 pb-10 sm:pt-24 sm:pb-12"
    >
      <Container>
        <div className="grid grid-cols-1 items-center gap-8 px-3 sm:px-4 lg:grid-cols-2 lg:gap-10">
          <HeroContent
            name={heroIdentity.name}
            tagline={heroIdentity.tagline}
            summary={heroIdentity.summary}
            mode={activeMode}
            roles={activeRoles}
            onModeChange={handleModeChange}
          />

          <Motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
            className="relative mx-auto w-full max-w-md lg:ml-auto"
          >
            <Motion.div
              aria-hidden
              className="pointer-events-none absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-zinc-500/20 blur-3xl"
              animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.12, 1] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <Card
              hoverEffect={false}
              className="relative overflow-hidden border-zinc-800/90 bg-gradient-to-b from-zinc-900/75 to-black/95 p-4 sm:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Current Focus
                  </p>
                  <p className="text-sm font-semibold text-zinc-100">
                    {activeModeLabel}
                  </p>
                </div>
                <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                  {activeMode}
                </span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <Motion.ul
                  key={activeMode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="space-y-2"
                >
                  {activeHighlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-2 text-sm text-zinc-300"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                      <span className="break-words">{highlight}</span>
                    </li>
                  ))}
                </Motion.ul>
              </AnimatePresence>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-md border border-zinc-800 bg-zinc-950/65 p-2 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                    UI
                  </p>
                  <p className="text-sm font-semibold text-zinc-100">Compact</p>
                </div>
                <div className="rounded-md border border-zinc-800 bg-zinc-950/65 p-2 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Stack
                  </p>
                  <p className="text-sm font-semibold text-zinc-100">Modular</p>
                </div>
                <div className="rounded-md border border-zinc-800 bg-zinc-950/65 p-2 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Render
                  </p>
                  <p className="text-sm font-semibold text-zinc-100">Smooth</p>
                </div>
              </div>
            </Card>
          </Motion.div>
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default HeroSection;
