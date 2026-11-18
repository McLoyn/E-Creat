import React from 'react';
import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';

interface StateMessageProps {
  type: 'loading' | 'empty' | 'error';
  title?: string;
  message: string;
  onRetry?: () => void;
  actionText?: string;
  actionHref?: string;
  className?: string;
}

export const StateMessage: React.FC<StateMessageProps> = ({
  type,
  title,
  message,
  onRetry,
  actionText,
  actionHref,
  className = '',
}) => {
  if (type === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`py-12 px-6 flex flex-col items-center justify-center text-center space-y-3 ${className}`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-600 motion-reduce:animate-none" />
        <p className="text-sm font-medium text-ink-soft">{message || 'Memuat data...'}</p>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div
        role="alert"
        className={`py-8 px-6 rounded-tk-lg bg-surface border border-danger/30 text-center space-y-3 shadow-sm ${className}`}
      >
        <div className="w-10 h-10 mx-auto rounded-full bg-danger/10 text-danger flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-ink font-display">{title || 'Gagal Memuat Data'}</h4>
          <p className="text-xs text-ink-soft mt-1 max-w-md mx-auto">{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-tk-md bg-forest hover:bg-forest-800 text-surface text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        )}
      </div>
    );
  }

  // type === 'empty'
  return (
    <div
      className={`py-10 px-6 rounded-tk-lg bg-surface border border-line text-center space-y-3 shadow-sm ${className}`}
    >
      <div className="w-10 h-10 mx-auto rounded-full bg-canvas text-ink-soft flex items-center justify-center">
        <Inbox className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-ink font-display">{title || 'Belum Ada Data'}</h4>
        <p className="text-xs text-ink-soft mt-1 max-w-md mx-auto">{message}</p>
      </div>
      {actionHref && actionText && (
        <a
          href={actionHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-tk-md bg-canvas hover:bg-line/40 text-forest text-xs font-semibold border border-line transition"
        >
          {actionText}
        </a>
      )}
    </div>
  );
};
