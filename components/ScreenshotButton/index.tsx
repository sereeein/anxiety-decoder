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
        backgroundColor: '#DCE3CB',
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
      className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150"
    >
      保存图片
    </button>
  );
}
