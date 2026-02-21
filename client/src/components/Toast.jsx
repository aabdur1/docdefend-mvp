import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onRemove, 300);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  const icons = {
    success: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  };

  const styles = {
    success: {
      border: 'border-l-healthcare-500',
      icon: 'bg-healthcare-500 text-white',
      title: 'text-slate-800 dark:text-white',
      bar: 'bg-healthcare-500/40 dark:bg-trace/40',
    },
    error: {
      border: 'border-l-red-500',
      icon: 'bg-red-500 text-white',
      title: 'text-slate-800 dark:text-white',
      bar: 'bg-red-500/40',
    },
    info: {
      border: 'border-l-blue-500',
      icon: 'bg-blue-500 text-white',
      title: 'text-slate-800 dark:text-white',
      bar: 'bg-blue-500/40',
    },
    warning: {
      border: 'border-l-amber-500',
      icon: 'bg-amber-500 text-white',
      title: 'text-slate-800 dark:text-white',
      bar: 'bg-amber-500/40',
    },
  };

  const duration = toast.duration || 4000;
  const s = styles[toast.type] || styles.info;

  return (
    <div
      className={`
        ${isExiting ? 'toast-exit' : 'toast-enter'}
        relative overflow-hidden flex items-center gap-3 px-5 py-4 rounded-xl
        bg-[#F5EFE0] dark:bg-instrument-bg-raised
        border border-[#D6C9A8] dark:border-instrument-border
        border-l-4 ${s.border}
        shadow-2xl shadow-black/10 dark:shadow-black/40
        min-w-0 sm:min-w-[300px] max-w-[calc(100vw-2rem)] sm:max-w-md
      `}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${s.icon} flex items-center justify-center shadow-sm`}>
        {icons[toast.type] || icons.info}
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`font-semibold text-sm font-body ${s.title}`}>{toast.title}</p>
        )}
        <p className={`text-sm text-slate-600 dark:text-slate-400 ${toast.title ? '' : 'font-medium'}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onRemove, 300);
        }}
        className="flex-shrink-0 p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-[#EDE6D3] dark:hover:bg-instrument-bg-surface transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {/* Countdown progress bar */}
      <div
        className={`toast-countdown absolute bottom-0 left-0 right-0 h-0.5 ${s.bar} origin-left`}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
  }, [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
