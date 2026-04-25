'use client';

import type { ReactNode } from 'react';
import { useId } from 'react';

interface CatFrameProps {
  children: ReactNode;
  /** Different seeds → different scribble pattern. Use a stable seed per cat for consistent look. */
  seed?: number;
  className?: string;
}

/**
 * Wraps a cat illustration with a hand-drawn crayon scribble overlay
 * along the perimeter, hiding the rectangular PNG edges with strokes.
 * Pair with .cat-soft-mask on the inner Image so the underlying rectangle
 * also fades; together you get a "drawn around" feel rather than a
 * hard photo cut.
 */
export default function CatFrame({
  children,
  seed = 7,
  className = '',
}: CatFrameProps) {
  const reactId = useId().replace(/[:]/g, '');
  const filterId = `crayon-rough-${reactId}`;

  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.55"
              numOctaves="2"
              seed={seed}
            />
            <feDisplacementMap in="SourceGraphic" scale="5" />
          </filter>
        </defs>
        <g
          filter={`url(#${filterId})`}
          stroke="#3D2F1F"
          strokeLinecap="round"
          fill="none"
          opacity="0.78"
        >
          {/* Top edge — two layered wavy strokes */}
          <path d="M 6 5 Q 25 3 48 6 T 94 4" strokeWidth="1.6" />
          <path d="M 8 8 Q 30 9 52 6 T 92 9" strokeWidth="1.2" />
          {/* Bottom edge */}
          <path d="M 5 95 Q 28 92 50 96 T 94 93" strokeWidth="1.6" />
          <path d="M 9 92 Q 32 96 55 91 T 91 96" strokeWidth="1.2" />
          {/* Left edge */}
          <path d="M 5 7 Q 3 28 6 51 T 4 92" strokeWidth="1.6" />
          <path d="M 8 11 Q 5 32 7 54 T 8 88" strokeWidth="1.2" />
          {/* Right edge */}
          <path d="M 95 7 Q 96 30 92 51 T 95 92" strokeWidth="1.6" />
          <path d="M 92 11 Q 95 33 95 54 T 92 88" strokeWidth="1.2" />
          {/* Corner accents — short crayon dabs */}
          <path d="M 4 6 L 9 4" strokeWidth="1.4" />
          <path d="M 91 4 L 96 7" strokeWidth="1.4" />
          <path d="M 4 94 L 9 96" strokeWidth="1.4" />
          <path d="M 91 96 L 96 93" strokeWidth="1.4" />
        </g>
      </svg>
    </div>
  );
}
