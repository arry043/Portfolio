const SectionSkeleton = ({ lines = 3, cardCount = 3 }) => {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 sm:p-4">
      <div className="space-y-2">
        <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
        {Array.from({ length: lines }).map((_, index) => (
          <div key={`line-${index}`} className="h-3 animate-pulse rounded bg-zinc-900" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div
            key={`card-${index}`}
            className="h-36 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900"
          />
        ))}
      </div>
    </div>
  );
};

export default SectionSkeleton;
