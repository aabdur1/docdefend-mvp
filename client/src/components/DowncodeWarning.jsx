import { useState } from 'react';

const RISK_STYLES = {
  HIGH: {
    border: 'border-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: 'text-red-500',
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    loss: 'text-red-600 dark:text-red-400',
  },
  MEDIUM: {
    border: 'border-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-500',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    loss: 'text-amber-600 dark:text-amber-400',
  },
  LOW: {
    border: 'border-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
    icon: 'text-green-500',
    badge: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    loss: 'text-green-600 dark:text-green-400',
  },
};

function ShieldIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

export default function DowncodeWarning({ downcodeRisk }) {
  const [expanded, setExpanded] = useState(false);

  if (!downcodeRisk || downcodeRisk.riskLevel === 'NONE') return null;

  const risk = downcodeRisk;
  const style = RISK_STYLES[risk.riskLevel] || RISK_STYLES.MEDIUM;
  const hasTips = risk.preventionTips?.length > 0;
  const hasAdjustment = risk.predictedAdjustment;

  return (
    <div className={`rounded-xl border-l-4 ${style.border} ${style.bg} border border-[#D6C9A8]/50 dark:border-instrument-border/50 overflow-hidden animate-fadeInUp`}>
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Payer Downcoding Risk
              </h4>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                {risk.riskLevel}
              </span>
            </div>

            {/* Policy name */}
            {risk.policy && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {risk.policy.name}
                {risk.policy.status === 'paused_ca' && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">(paused in CA)</span>
                )}
              </p>
            )}

            {/* Predicted adjustment + financial impact */}
            {hasAdjustment && (
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200 bg-[#EDE6D3] dark:bg-instrument-bg-surface px-2 py-0.5 rounded">
                    {risk.predictedAdjustment.from}
                  </span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200 bg-[#EDE6D3] dark:bg-instrument-bg-surface px-2 py-0.5 rounded">
                    {risk.predictedAdjustment.to}
                  </span>
                </div>
                {risk.financialImpact?.loss > 0 && (
                  <span className={`font-mono text-sm font-bold ${style.loss}`}>
                    {risk.financialImpact.formatted.loss}/claim
                  </span>
                )}
              </div>
            )}

            {/* Rationale */}
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {risk.rationale}
            </p>
          </div>
        </div>
      </div>

      {/* Expandable prevention tips */}
      {hasTips && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors border-t border-[#D6C9A8]/30 dark:border-instrument-border/30"
          >
            <span>{expanded ? 'Hide' : 'Show'} Prevention Tips ({risk.preventionTips.length})</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="px-4 sm:px-5 pb-4 space-y-2.5 animate-fadeIn">
              {risk.preventionTips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-healthcare-500/10 dark:bg-trace/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-healthcare-500 dark:text-trace">{idx + 1}</span>
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
