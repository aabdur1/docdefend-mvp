import { useEffect, useState } from 'react';

const SCORE_CONFIG = {
  HIGH: { color: '#10b981', darkColor: '#34d399', pct: 90, label: 'HIGH' },
  MEDIUM: { color: '#f59e0b', darkColor: '#fbbf24', pct: 55, label: 'MED' },
  LOW: { color: '#ef4444', darkColor: '#f87171', pct: 25, label: 'LOW' },
};

export default function ScoreRing({ score, size = 96 }) {
  const [mounted, setMounted] = useState(false);
  const config = SCORE_CONFIG[score] || SCORE_CONFIG.MEDIUM;

  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (config.pct / 100) * circumference;

  useEffect(() => {
    // Trigger animation after mount
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="score-ring-container relative flex-shrink-0"
      style={{
        width: size,
        height: size,
        '--ring-circumference': circumference,
        '--ring-offset': offset,
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="score-ring-track"
          strokeWidth={strokeWidth}
          style={{ stroke: 'var(--color-bg-surface, #EDE6D3)' }}
        />
        {/* Fill */}
        {mounted && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="score-ring-fill"
            strokeWidth={strokeWidth}
            style={{ stroke: config.color }}
          />
        )}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-lg font-bold font-mono leading-none"
          style={{ color: config.color }}
        >
          {config.pct}
        </span>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
          {config.label}
        </span>
      </div>
    </div>
  );
}
