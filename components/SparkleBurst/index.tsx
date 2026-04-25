'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface SparkleBurstProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const SPARKLE_COUNT = 8;
const DISTANCE = 44;
const DURATION = 0.65;

export default function SparkleBurst({ x, y, onComplete }: SparkleBurstProps) {
  useEffect(() => {
    const t = setTimeout(onComplete, DURATION * 1000 + 50);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div
      className="fixed pointer-events-none z-[10000]"
      style={{ left: x, top: y }}
      aria-hidden="true"
    >
      {Array.from({ length: SPARKLE_COUNT }).map((_, i) => {
        const angle = (i / SPARKLE_COUNT) * Math.PI * 2;
        const dx = Math.cos(angle) * DISTANCE;
        const dy = Math.sin(angle) * DISTANCE;
        const size = 6 + (i % 3) * 2;
        return (
          <motion.svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 8 8"
            className="absolute"
            initial={{ x: -size / 2, y: -size / 2, opacity: 1, scale: 1, rotate: 0 }}
            animate={{
              x: dx - size / 2,
              y: dy - size / 2,
              opacity: 0,
              scale: 0.3,
              rotate: 180,
            }}
            transition={{ duration: DURATION, ease: 'easeOut' }}
          >
            <path
              d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z"
              fill="var(--sparkle)"
            />
          </motion.svg>
        );
      })}
    </div>
  );
}
