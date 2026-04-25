// components/DelaySelector/index.tsx
'use client';

const OPTIONS = [1, 3, 7] as const;

interface DelaySelectorProps {
  value: number;
  onChange: (days: number) => void;
}

export default function DelaySelector({ value, onChange }: DelaySelectorProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((d) => (
        <button
          type="button"
          key={d}
          onClick={() => onChange(d)}
          className={`rounded-full px-4 py-1 text-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-150 ${
            value === d
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--card-bg)] border-2 border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <span className="font-handwriting-en text-sm mr-1">{d}</span>天后
        </button>
      ))}
    </div>
  );
}
