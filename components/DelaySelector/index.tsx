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
          className={`rounded-full px-3 py-1 text-xs transition ${
            value === d
              ? 'bg-stone-800 text-white'
              : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
          }`}
        >
          {d} 天后
        </button>
      ))}
    </div>
  );
}
