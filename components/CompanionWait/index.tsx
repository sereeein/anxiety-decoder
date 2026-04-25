// components/CompanionWait/index.tsx
'use client';

interface CompanionWaitProps {
  copy: string | null;
  onReturn: () => void;
  returnBusy: boolean;
}

export default function CompanionWait({ copy, onReturn, returnBusy }: CompanionWaitProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12 px-6 bg-[var(--bg)]">
      <p className="font-handwriting-cn max-w-md text-center text-3xl leading-relaxed text-[var(--text)]">
        {copy ?? '去吧，我在这里等你回来。'}
      </p>
      <button
        type="button"
        onClick={onReturn}
        disabled={returnBusy}
        className="rounded-full bg-[var(--accent)] text-white px-6 py-2 text-sm hover:bg-[var(--input-border-focus)] hover:-translate-y-0.5 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {returnBusy ? '…' : '我回来了'}
      </button>
    </div>
  );
}
