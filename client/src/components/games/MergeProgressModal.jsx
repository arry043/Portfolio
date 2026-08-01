import { memo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Merge, Trash2, Gamepad2 } from 'lucide-react';

const MergeProgressModal = ({ isOpen, onMerge, onDiscard, isLoading }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          id="merge-progress-overlay"
        >
          <Motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50"
            id="merge-progress-modal"
          >
            {/* Header */}
            <div className="border-b border-zinc-800 px-5 py-4 text-center">
              <div className="mx-auto mb-2 inline-flex rounded-full border border-zinc-700 bg-zinc-900 p-2.5">
                <Gamepad2 className="h-5 w-5 text-zinc-300" />
              </div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-100">
                Local Game Progress Found
              </h2>
              <p className="mt-1.5 text-sm text-zinc-500">
                You have game scores saved locally from guest play. Would you
                like to merge them into your account?
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 px-5 py-4">
              <button
                onClick={onMerge}
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black shadow-md transition-colors duration-200 hover:bg-gray-200 disabled:opacity-50"
                id="merge-btn"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-700" />
                ) : (
                  <Merge className="h-4 w-4" />
                )}
                Merge Progress
              </button>

              <button
                onClick={onDiscard}
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
                id="discard-btn"
              >
                <Trash2 className="h-4 w-4" />
                Discard &amp; Start Fresh
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(MergeProgressModal);
