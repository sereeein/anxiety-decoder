// components/RetryError/index.tsx
'use client';

interface RetryErrorProps {
  message: string;
  onRetry: () => void;
  busy: boolean;
}

export default function RetryError({ message, onRetry, busy }: RetryErrorProps) {
  return (
    <div className="rounded-2xl border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 items-start">
      <p className="text-sm text-[var(--text)]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={busy}
        className="rounded-full bg-[var(--accent)] text-white px-6 py-2 text-sm hover:bg-[var(--input-border-focus)] hover:-translate-y-0.5 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {busy ? '重试中…' : '再试一次'}
      </button>
    </div>
  );
}
