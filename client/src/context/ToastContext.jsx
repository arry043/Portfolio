/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_DURATION_MS = 3200;

const ICON_BY_TYPE = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const createToastRecord = (payload, id) => ({
  id,
  type: payload.type || 'info',
  title: payload.title || '',
  message: payload.message || '',
  actionLabel: payload.actionLabel,
  onAction: payload.onAction,
  persistent: Boolean(payload.persistent),
});

const ToastViewport = ({ toasts, onDismiss }) => {
  return (
    <div className="pointer-events-none fixed right-3 top-20 z-[80] w-[calc(100vw-1.5rem)] max-w-sm space-y-2 sm:right-4 sm:top-24">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICON_BY_TYPE[toast.type] || ICON_BY_TYPE.info;
          const isLoading = toast.type === 'loading';

          return (
            <Motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto rounded-lg border border-zinc-800 bg-zinc-950/95 p-3 shadow-xl shadow-black/40 backdrop-blur"
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    isLoading
                      ? 'animate-spin text-zinc-400'
                      : toast.type === 'success'
                      ? 'text-zinc-200'
                      : toast.type === 'error'
                      ? 'text-zinc-300'
                      : 'text-zinc-400'
                  }`}
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  {toast.title ? (
                    <p className="truncate text-sm font-semibold text-zinc-100">{toast.title}</p>
                  ) : null}
                  {toast.message ? (
                    <p className="text-sm leading-relaxed text-zinc-400">{toast.message}</p>
                  ) : null}
                  {toast.actionLabel && typeof toast.onAction === 'function' ? (
                    <button
                      type="button"
                      className="mt-1 text-sm font-medium text-zinc-200 underline-offset-4 hover:underline"
                      onClick={() => {
                        toast.onAction();
                        onDismiss(toast.id);
                      }}
                    >
                      {toast.actionLabel}
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => onDismiss(toast.id)}
                  className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                >
                  <span className="text-xs">x</span>
                </button>
              </div>
            </Motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timeoutMapRef = useRef(new Map());
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((items) => items.filter((item) => item.id !== id));

    const timeoutHandle = timeoutMapRef.current.get(id);
    if (timeoutHandle) {
      window.clearTimeout(timeoutHandle);
      timeoutMapRef.current.delete(id);
    }
  }, []);

  const scheduleDismiss = useCallback(
    (id, duration = TOAST_DURATION_MS) => {
      const timeoutHandle = window.setTimeout(() => dismiss(id), duration);
      timeoutMapRef.current.set(id, timeoutHandle);
    },
    [dismiss]
  );

  const show = useCallback(
    (payload) => {
      idRef.current += 1;
      const id = idRef.current;
      const nextToast = createToastRecord(payload, id);

      setToasts((items) => [nextToast, ...items].slice(0, 5));

      if (!nextToast.persistent) {
        scheduleDismiss(id, payload.duration || TOAST_DURATION_MS);
      }

      return id;
    },
    [scheduleDismiss]
  );

  const update = useCallback(
    (id, payload) => {
      setToasts((items) =>
        items.map((item) => (item.id === id ? { ...item, ...payload } : item))
      );

      const timeoutHandle = timeoutMapRef.current.get(id);
      if (timeoutHandle) {
        window.clearTimeout(timeoutHandle);
      }

      if (!payload.persistent) {
        scheduleDismiss(id, payload.duration || TOAST_DURATION_MS);
      }
    },
    [scheduleDismiss]
  );

  const value = useMemo(
    () => ({
      show,
      dismiss,
      update,
      success: (message, title = 'Success') => show({ type: 'success', title, message }),
      error: (message, title = 'Error') => show({ type: 'error', title, message }),
      warning: (message, title = 'Warning') => show({ type: 'warning', title, message }),
      info: (message, title = 'Info') => show({ type: 'info', title, message }),
      loading: (message, title = 'Loading') =>
        show({ type: 'loading', title, message, persistent: true }),
    }),
    [dismiss, show, update]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};
