'use client';

import { useEffect, useState } from 'react';
import SparkleBurst from '@/components/SparkleBurst';

interface Burst {
  id: number;
  x: number;
  y: number;
}

export default function MagicCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!hoverable) return;
    setEnabled(true);

    const handleMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    const handleClick = (e: MouseEvent) => {
      const id = Date.now() + Math.random();
      setBursts((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: pos.x - 6,
          top: pos.y - 26,
          transition: 'transform 40ms linear',
        }}
        aria-hidden="true"
      >
        <Wand />
      </div>
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
}

function Wand() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <line
        x1="6"
        y1="26"
        x2="22"
        y2="10"
        stroke="var(--wand-stick)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 4 L24 9 L29 10 L24 12 L22 17 L20 12 L15 10 L20 9 Z"
        fill="var(--wand-star)"
        stroke="var(--text)"
        strokeWidth="0.5"
      />
    </svg>
  );
}
