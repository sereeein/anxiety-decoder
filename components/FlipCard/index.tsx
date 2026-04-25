'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  /** Auto-flip to back after this many ms once mounted. Omit to disable. */
  autoFlipAfter?: number;
  className?: string;
}

/**
 * 3D flip container. Back drives the natural height; front overlays absolute.
 * Click anywhere on the front to flip to back. The back face has its own corner
 * toggle button (rendered by the result page) so inner controls (DecodeCard
 * primary button, CategoryChip dropdown) work without swallowing flip clicks.
 */
export default function FlipCard({
  front,
  back,
  autoFlipAfter,
  className = '',
}: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (typeof autoFlipAfter !== 'number') return;
    const t = setTimeout(() => setFlipped(true), autoFlipAfter);
    return () => clearTimeout(t);
  }, [autoFlipAfter]);

  const toggle = () => setFlipped((f) => !f);

  return (
    <div
      className={`relative w-full ${className}`}
      style={{ perspective: '1400px' }}
    >
      <motion.div
        className="relative w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Back drives container height, initially rotated away. */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
          <FlipBackButton onClick={toggle} label="再看一眼小猫" />
        </div>
        {/* Front overlays. Click anywhere flips to back. */}
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 w-full block text-left"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          aria-label="点击查看你的解码结果"
        >
          {front}
        </button>
      </motion.div>
    </div>
  );
}

function FlipBackButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute top-4 right-4 text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150"
      aria-label={label}
    >
      ↻ {label}
    </button>
  );
}
