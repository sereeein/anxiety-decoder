'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FlipCardProps {
  showBack: boolean;
  onToggle: () => void;
  front: ReactNode;
  back: ReactNode;
  className?: string;
}

export default function FlipCard({
  showBack,
  onToggle,
  front,
  back,
  className = '',
}: FlipCardProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{ perspective: '1600px' }}
    >
      <motion.div
        animate={{ rotateY: showBack ? 180 : 0 }}
        transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
        style={{
          transformStyle: 'preserve-3d',
          position: 'relative',
        }}
      >
        {/* Back face — in flow, drives container height */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
        {/* Front face — absolute over back, centered */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {front}
        </div>
      </motion.div>

      {/* Flip toggle — sits outside the rotating element so it stays static */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={showBack ? '翻回猫图' : '翻到解码卡'}
        className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--text)] shadow-sm transition-all duration-150 hover:bg-[var(--accent)] hover:text-white hover:-translate-y-0.5 active:scale-95"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4" />
          <path d="M12 2v3h-3M4 14v-3h3" />
        </svg>
      </button>
    </div>
  );
}
