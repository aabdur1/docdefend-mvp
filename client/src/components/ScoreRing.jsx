import { useEffect, useState, useRef } from 'react';

const SCORE_CONFIG = {
  HIGH: { color: '#2D6A4F', darkColor: '#52B788', pct: 90, label: 'HIGH' },
  MEDIUM: { color: '#f59e0b', darkColor: '#fbbf24', pct: 55, label: 'MED' },
  LOW: { color: '#ef4444', darkColor: '#f87171', pct: 25, label: 'LOW' },
};

function useCountUp(target, duration = 1000, delay = 300) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target <= 0) { setValue(0); return; }

    const timer = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(step);
        }
      };
      frameRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, delay]);

  return value;
}

export default function ScoreRing({ score, size = 96 }) {
  const [mounted, setMounted] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const config = SCORE_CONFIG[score] || SCORE_CONFIG.MEDIUM;
  const animatedPct = useCountUp(config.pct, 1200, 400);

  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (config.pct / 100) * circumference;

  useEffect(() => {
    // Trigger animation after mount
    const t = setTimeout(() => setMounted(true), 50);
    // Stagger label entrance after counter settles
    const t2 = setTimeout(() => setShowLabel(true), 800);
    return () => { clearTimeout(t); clearTimeout(t2); };
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
            style={{ stroke: isDark ? config.darkColor : config.color }}
          />
        )}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-lg font-bold font-mono leading-none"
          style={{ color: isDark ? config.darkColor : config.color }}
        >
          {animatedPct}
        </span>
        <span
          className={`text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5 transition-all duration-500 ${showLabel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}
