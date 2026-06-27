import { memo, useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import SkillGraph from './SkillGraph';
import { Link } from 'react-router-dom';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.35, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.25, ease: 'easeIn' }
  }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.4, type: 'spring', stiffness: 220, damping: 23 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.96, 
    y: 6,
    transition: { duration: 0.25, ease: 'easeInOut' }
  }
};

const SkillModal = ({ isOpen, onClose, skills = [] }) => {
  const closeButtonRef = useRef(null);

  // Key listeners (Escape to close) & scroll locking
  useEffect(() => {
    if (!isOpen) return;

    // Lock page scrolling
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus the close button for accessibility
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop Blur layer */}
          <Motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <Motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative w-full max-w-5xl h-[85vh] md:h-[80vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl overflow-hidden focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 bg-zinc-950/60 z-10">
              <div>
                <h3 id="modal-title" className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
                  Interactive Technology Map
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/about"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1"
                >
                  All Skills
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-zinc-800 bg-zinc-900/60 p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label="Close interactive view"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Core Interactive Canvas */}
            <div className="flex-1 w-full relative min-h-0 bg-zinc-950/30">
              <SkillGraph skills={skills} isPreview={false} />
            </div>

            {/* Footer Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800/80 px-5 py-3.5 bg-zinc-950/80 z-10 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Drag nodes to collide and reposition. Click to apply impulse.
              </span>
              
              {/* Fill Legend */}
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Fill = Proficiency Level:</span>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-zinc-800 border border-zinc-700" />
                  <span>0% (None)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500/40 border border-emerald-500/20" />
                  <span>50% (Intermediate)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 border border-emerald-400/50 shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
                  <span>100% (Expert)</span>
                </div>
              </div>
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default memo(SkillModal);
