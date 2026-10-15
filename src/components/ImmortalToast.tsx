import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

export const useToast = () => {
  return useContext(ToastContext);
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (item: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...item, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              backgroundImage: `var(--bg-subcard), var(--border-rim)`,
              backgroundOrigin: 'padding-box, border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: `0 14px 30px rgba(0, 0, 0, 0.9), var(--shadow-convex-sm)`,
            }}
            className="immortal-container pointer-events-auto p-4 rounded-xl border border-transparent flex items-start gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200"
          >
            <div className="mt-0.5 shrink-0">
              {t.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : t.type === 'warning' ? (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              ) : t.type === 'info' ? (
                <Info className="w-4 h-4 text-sky-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs sm:text-sm font-semibold text-zinc-100">{t.title}</div>
              {t.description && (
                <div className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">{t.description}</div>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-500 hover:text-zinc-200 transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
