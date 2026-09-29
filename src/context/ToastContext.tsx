import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone global event emitter for triggering toasts from outside React component tree
type ToastEventListener = (toast: Omit<ToastItem, 'id'>) => void;
const listeners: Set<ToastEventListener> = new Set();

export const notify = {
  success: (title: string, message?: string) => {
    listeners.forEach((fn) => fn({ type: 'success', title, message }));
  },
  error: (title: string, message?: string) => {
    listeners.forEach((fn) => fn({ type: 'error', title, message }));
  },
  warning: (title: string, message?: string) => {
    listeners.forEach((fn) => fn({ type: 'warning', title, message }));
  },
  info: (title: string, message?: string) => {
    listeners.forEach((fn) => fn({ type: 'info', title, message }));
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 3000 }: Omit<ToastItem, 'id'>) => {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  React.useEffect(() => {
    const handleNotify: ToastEventListener = (toastData) => {
      showToast(toastData);
    };
    listeners.add(handleNotify);
    return () => {
      listeners.delete(handleNotify);
    };
  }, [showToast]);

  const success = useCallback(
    (title: string, message?: string, duration: number = 3000) =>
      showToast({ type: 'success', title, message, duration }),
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration: number = 4000) =>
      showToast({ type: 'error', title, message, duration }),
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration: number = 3500) =>
      showToast({ type: 'warning', title, message, duration }),
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration: number = 3000) =>
      showToast({ type: 'info', title, message, duration }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Container de Toasts Flutuantes */}
      <div
        className="fixed top-4 right-4 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0"
        aria-live="assertive"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
                isSuccess
                  ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                  : isError
                  ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                  : isWarning
                  ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
                  : 'bg-sky-50/95 dark:bg-sky-950/90 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                {isInfo && <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs sm:text-sm font-bold leading-tight tracking-tight">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-[11px] sm:text-xs mt-1 leading-snug opacity-90 break-words font-medium">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
                aria-label="Fechar notificação"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback gracioso se usado fora do provider
    return {
      toasts: [],
      showToast: (toast: Omit<ToastItem, 'id'>) => {
        notify[toast.type](toast.title, toast.message);
        return '';
      },
      success: (title: string, message?: string) => {
        notify.success(title, message);
        return '';
      },
      error: (title: string, message?: string) => {
        notify.error(title, message);
        return '';
      },
      warning: (title: string, message?: string) => {
        notify.warning(title, message);
        return '';
      },
      info: (title: string, message?: string) => {
        notify.info(title, message);
        return '';
      },
      removeToast: () => {}
    };
  }
  return context;
}
