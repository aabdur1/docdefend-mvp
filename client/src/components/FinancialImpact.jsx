import { getRate } from '../data/reimbursementRates';

function parseDollar(str) {
  if (!str) return 0;
  const num = parseFloat(String(str).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

function MetricCard({ label, value, icon, colorClass }) {
  return (
    <div className="flex-1 text-center p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-slate-700/50 shadow-sm">
      <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}

export default function FinancialImpact({ financialImpact, codeAnalysis }) {
  if (!financialImpact) return null;

  const { totalClaimValue, atRiskAmount, potentialRecovery, breakdown } = financialImpact;

  const totalNum = parseDollar(totalClaimValue);
  const atRiskNum = parseDollar(atRiskAmount);
  const recoveryNum = parseDollar(potentialRecovery);

  // Calculate risk percentage for the visual bar
  const riskPct = totalNum > 0 ? Math.min(100, Math.round((atRiskNum / totalNum) * 100)) : 0;

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 animate-fadeInUp">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Financial Impact</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Estimated Medicare reimbursement analysis</p>
        </div>
      </div>

      {/* Top-level metrics */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <MetricCard
          label="Claim Value"
          value={totalClaimValue || '$0'}
          colorClass="bg-emerald-100 dark:bg-emerald-900/50"
          icon={
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="At Risk"
          value={atRiskAmount || '$0'}
          colorClass="bg-red-100 dark:bg-red-900/50"
          icon={
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
        <MetricCard
          label="Recovery"
          value={potentialRecovery || '$0'}
          colorClass="bg-blue-100 dark:bg-blue-900/50"
          icon={
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Risk bar */}
      {totalNum > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Revenue at risk</span>
            <span>{riskPct}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                riskPct > 60 ? 'bg-red-500' : riskPct > 30 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${riskPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Per-code breakdown */}
      {breakdown?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Per-code breakdown</p>
          {breakdown.map((item, idx) => {
            const itemAtRisk = parseDollar(item.atRisk);
            const itemReimb = parseDollar(item.estimatedReimbursement);
            const isAtRisk = itemAtRisk > 0;
            return (
              <div
                key={idx}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 p-2 rounded-lg text-sm ${
                  isAtRisk
                    ? 'bg-red-50/80 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30'
                    : 'bg-green-50/80 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                    {item.code}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.reason}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-600 dark:text-slate-300">{item.estimatedReimbursement}</span>
                  {isAtRisk && (
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                      -{item.atRisk} at risk
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
