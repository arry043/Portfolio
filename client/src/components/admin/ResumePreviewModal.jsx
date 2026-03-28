import { memo, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { ExternalLink, Loader2, X } from 'lucide-react';
import { buildResumePreviewUrl } from '../../lib/resumeDownload';

const ResumePreviewModal = ({ open, resume, onClose }) => {
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');
  const previewUrl = buildResumePreviewUrl(resume?.fileUrl);
  const closeModal = useCallback(() => {
    setHasLoadError(false);
    setIsLoadingPreview(false);
    setIframeSrc('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [open, closeModal]);

  useEffect(() => {
    if (!open || !previewUrl) {
      setIframeSrc('');
      setIsLoadingPreview(false);
      return undefined;
    }

    const abortController = new AbortController();
    let objectUrl = '';
    let isMounted = true;

    setHasLoadError(false);
    setIsLoadingPreview(true);
    setIframeSrc('');

    const loadPreview = async () => {
      try {
        const response = await fetch(previewUrl, { signal: abortController.signal });

        if (!response.ok) {
          throw new Error('Unable to load preview');
        }

        const payload = await response.blob();
        const pdfBlob =
          payload.type && payload.type.toLowerCase().includes('pdf')
            ? payload
            : new Blob([payload], { type: 'application/pdf' });

        objectUrl = URL.createObjectURL(pdfBlob);

        if (!isMounted) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setIframeSrc(objectUrl);
      } catch {
        if (!abortController.signal.aborted && isMounted) {
          setHasLoadError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPreview(false);
        }
      }
    };

    loadPreview();

    return () => {
      isMounted = false;
      abortController.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [open, previewUrl]);

  return (
    <AnimatePresence>
      {open ? (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-3 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <Motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex h-[min(88vh,52rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
              <p className="truncate text-sm font-semibold text-zinc-100">
                Resume Preview{resume?.title ? ` - ${resume.title}` : ''}
              </p>
              <div className="flex items-center gap-2">
                {previewUrl ? (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-zinc-800 bg-zinc-900 p-1 text-zinc-400 transition-colors hover:text-zinc-200"
                  aria-label="Close preview modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-zinc-900/40">
              {isLoadingPreview ? (
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-zinc-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading preview...
                  </div>
                </div>
              ) : iframeSrc && !hasLoadError ? (
                <iframe
                  title="Resume PDF Preview"
                  src={iframeSrc}
                  className="h-full w-full"
                  onError={() => setHasLoadError(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-200">
                      Preview is unavailable for this resume.
                    </p>
                    <p className="text-xs text-zinc-400">
                      Please use the Open button to view or download the file directly.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default memo(ResumePreviewModal);
