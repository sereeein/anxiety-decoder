// components/ScreenshotButton/index.tsx
'use client';

import { useRef } from 'react';
import { toPng } from 'html-to-image';

interface ScreenshotButtonProps {
  /** CSS selector pointing to the element to screenshot. */
  targetSelector: string;
  fileName?: string;
}

export default function ScreenshotButton({
  targetSelector,
  fileName = 'anxiety-decoder-card.png',
}: ScreenshotButtonProps) {
  const busy = useRef(false);

  const handleExport = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const node = document.querySelector(targetSelector) as HTMLElement | null;
      if (!node) return;
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: '#fafaf9',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      a.click();
    } finally {
      busy.current = false;
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs text-stone-700 hover:border-stone-400"
    >
      保存图片
    </button>
  );
}
