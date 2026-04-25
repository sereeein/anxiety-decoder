// hooks/useSparkleOnMobile.tsx
'use client';

import { useState, useCallback } from 'react';
import SparkleBurst from '@/components/SparkleBurst';

interface Burst {
  id: number;
  x: number;
  y: number;
}

export function useSparkleOnMobile() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  const spark = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (typeof window === 'undefined') return;
    // Hover-capable devices (desktop) get sparkle from MagicCursor's global click handler.
    // Skip here to avoid double-spark.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (e) {
      if ('touches' in e && e.touches[0]) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if (
        'clientX' in e &&
        typeof (e as React.MouseEvent).clientX === 'number'
      ) {
        x = (e as React.MouseEvent).clientX;
        y = (e as React.MouseEvent).clientY;
      }
    }
    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, { id, x, y }]);
  }, []);

  const portal = (
    <>
      {bursts.map((b) => (
        <SparkleBurst
          key={b.id}
          x={b.x}
          y={b.y}
          onComplete={() =>
            setBursts((prev) => prev.filter((p) => p.id !== b.id))
          }
        />
      ))}
    </>
  );

  return { spark, portal };
}
