// components/CompanionWait/index.tsx
'use client';

interface CompanionWaitProps {
  copy: string | null;
  onReturn: () => void;
  returnBusy: boolean;
}

export default function CompanionWait({ copy, onReturn, returnBusy }: CompanionWaitProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12 px-6 bg-stone-50">
      <p className="max-w-md text-center text-2xl font-medium leading-relaxed text-stone-700">
        {copy ?? '去吧，我在这里等你回来。'}
      </p>
      <button
        type="button"
        onClick={onReturn}
        disabled={returnBusy}
        className="rounded-full bg-stone-800 px-6 py-3 text-sm text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {returnBusy ? '…' : '我回来了'}
      </button>
    </div>
  );
}
