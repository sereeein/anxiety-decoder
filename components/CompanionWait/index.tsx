// components/CompanionWait/index.tsx
'use client';

import Image from 'next/image';
import CatFrame from '@/components/CatFrame';

interface CompanionWaitProps {
  copy: string | null;
  onReturn: () => void;
  returnBusy: boolean;
}

export default function CompanionWait({ copy, onReturn, returnBusy }: CompanionWaitProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12 px-6 bg-[var(--bg)]">
      <CatFrame seed={3} className="w-56 md:w-64">
        <Image
          src="/illustrations/03-wait.png"
          alt="一只蓬松的橘色小猫坐在小书桌前"
          width={400}
          height={533}
          priority
          className="cat-soft-mask w-full h-auto"
        />
      </CatFrame>
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
