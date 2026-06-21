import { motion as Motion } from 'framer-motion';

const SkeletonLine = ({ className = '' }) => (
  <div className={`relative overflow-hidden rounded-sm bg-zinc-800/70 ${className}`}>
    <div className="absolute inset-y-0 w-1/2 animate-[blueprint-scan_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent" />
  </div>
);

const SectionSkeleton = ({ lines = 2, cardCount = 3, variant = 'cards', className = '' }) => {
  const isMetricGrid = variant === 'metrics';
  const gridColumns = variant === 'split' ? 'lg:grid-cols-2' : 'lg:grid-cols-3';

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${gridColumns} ${className}`}
      role="status"
      aria-label="Loading content"
    >
        {Array.from({ length: cardCount }).map((_, index) => (
          <div
            key={`card-${index}`}
            className={`blueprint-card relative overflow-hidden rounded-xl border border-sky-900/35 bg-zinc-950/65 p-4 ${isMetricGrid ? 'min-h-24' : 'min-h-40'}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.035)_1px,transparent_1px)] bg-[size:18px_18px]" />
            <div className="relative flex h-full flex-col justify-between gap-5">
              <div className="flex items-center justify-between">
                <SkeletonLine className="h-3 w-24" />
                <div className="h-5 w-5 rounded border border-sky-900/40 bg-sky-950/20" />
              </div>
              <div className="space-y-2.5">
                <SkeletonLine className={isMetricGrid ? 'h-7 w-16' : 'h-4 w-3/4'} />
                {!isMetricGrid && Array.from({ length: lines }).map((_, lineIndex) => (
                  <SkeletonLine
                    key={`line-${lineIndex}`}
                    className={`h-2.5 ${lineIndex === lines - 1 ? 'w-2/3' : 'w-full'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      <span className="sr-only">Content is loading from the server.</span>
    </Motion.div>
  );
};

export default SectionSkeleton;
