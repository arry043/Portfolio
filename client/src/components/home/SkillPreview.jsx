import { memo, useState } from 'react';
import { Maximize2, AlertCircle, RefreshCw } from 'lucide-react';
import SkillGraph from './SkillGraph';
import SkillModal from './SkillModal';

const SkillPreview = ({ skills = [], isLoading = false, isError = false, refetch }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const activeSkills = skills.filter((s) => s.isActive !== false);

  if (isError) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-center">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <div>
          <p className="text-sm font-medium text-zinc-300">Failed to load skills</p>
          <p className="text-xs text-zinc-500">There was an issue fetching technical skills data.</p>
        </div>
        {refetch && (
          <button
            type="button"
            onClick={refetch}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative min-h-[220px] rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-800/80" />
            <div className="h-3 w-40 animate-pulse rounded bg-zinc-850" />
          </div>
          <div className="h-8 w-8 animate-pulse rounded bg-zinc-800/80" />
        </div>

        {/* Animated placeholder bubbles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-48 h-24 flex items-center justify-center gap-3">
            <div className="h-10 w-10 animate-bounce rounded-full bg-zinc-800/60" style={{ animationDelay: '0s' }} />
            <div className="h-12 w-12 animate-bounce rounded-full bg-zinc-800/80" style={{ animationDelay: '0.15s' }} />
            <div className="h-8 w-8 animate-bounce rounded-full bg-zinc-800/50" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>

        <div className="h-3 w-32 animate-pulse rounded bg-zinc-850 self-start mt-auto z-10" />
      </div>
    );
  }

  if (activeSkills.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-center">
        <span className="inline-flex rounded-md border border-zinc-800 bg-zinc-900 p-2 text-zinc-500">
          No skills available.
        </span>
        <p className="text-xs text-zinc-500">Skills highlights will appear here once added.</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative flex flex-col justify-between min-h-[340px] rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 overflow-hidden group">

        {/* Title and top row */}
        <div className="flex items-start justify-between z-10">
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">
              Skill Highlights
            </p>
            <p className="text-sm font-semibold text-zinc-100">
              Interactive Technology Map
            </p>
          </div>

          {/* Zoom/Expand button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-zinc-400 hover:text-zinc-200 transition-colors shadow-lg hover:shadow-emerald-500/5 hover:border-zinc-700/80"
            title="Open Interactive View"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Small physics preview canvas inside card */}
        <div
          // onClick={() => setIsModalOpen(true)}
          className="absolute inset-0 top-10 bottom-6 cursor-pointer"
        >
          <SkillGraph skills={activeSkills} isPreview={true} />
        </div>

        {/* Footer info overlay */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 z-10 mt-auto">
          <span>{activeSkills.length} Technologies</span>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            Click to Explore &rarr;
          </button>
        </div>
      </div>

      {/* The Fullscreen Interactive Modal */}
      <SkillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        skills={activeSkills}
      />
    </>
  );
};

export default memo(SkillPreview);
