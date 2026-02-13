export default function EMLevelCard({ emLevelRecommendation, selectedCptCodes }) {
  if (!emLevelRecommendation) return null;

  const {
    documentedLevel,
    documentedLevelDescription,
    methodology,
    mdmDetails,
    rationale,
    comparedToSelected,
    revenueImpact,
  } = emLevelRecommendation;

  // Determine color scheme based on comparison
  const comparisonConfig = {
    MATCH: {
      bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      border: 'border-green-200 dark:border-green-800/50',
      icon: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/50',
      label: 'Correct Level',
      labelBg: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
      description: 'Your selected E/M level matches the documentation.',
    },
    UNDERCODED: {
      bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      border: 'border-blue-200 dark:border-blue-800/50',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      label: 'Undercoded',
      labelBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      description: 'Your documentation supports a higher E/M level than selected.',
    },
    OVERCODED: {
      bg: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      border: 'border-red-200 dark:border-red-800/50',
      icon: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      label: 'Overcoded',
      labelBg: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      description: 'Your documentation does not support the selected E/M level.',
    },
    'N/A': {
      bg: 'from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-slate-700/50',
      border: 'border-slate-200 dark:border-slate-700',
      icon: 'text-slate-600 dark:text-slate-400',
      iconBg: 'bg-slate-100 dark:bg-slate-700',
      label: 'N/A',
      labelBg: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      description: '',
    },
  };

  const config = comparisonConfig[comparedToSelected] || comparisonConfig['N/A'];

  const mdmLevelColor = (level) => {
    if (level === 'HIGH') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
    if (level === 'MODERATE') return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30';
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
  };

  // Find the selected E/M code
  const selectedEM = selectedCptCodes?.find(c => /^99\d{3}$/.test(c));

  return (
    <div className={`rounded-xl border ${config.border} bg-gradient-to-r ${config.bg} p-5 animate-fadeInUp`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
            <svg className={`w-5 h-5 ${config.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">E/M Level Recommendation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Based on {methodology === 'TIME' ? 'time-based' : 'MDM-based'} evaluation</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.labelBg}`}>
          {config.label}
        </span>
      </div>

      {/* Main recommendation */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 text-center p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50">
          {selectedEM && (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Selected</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{selectedEM}</p>
            </>
          )}
          {!selectedEM && (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Selected</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">No E/M code</p>
            </>
          )}
        </div>
        <div className="flex-shrink-0">
          <svg className={`w-6 h-6 ${config.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <div className="flex-1 text-center p-3 rounded-lg bg-white/80 dark:bg-slate-800/80 border-2 border-current/20 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Documented Level</p>
          <p className={`text-lg font-bold ${config.icon}`}>{documentedLevel}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{documentedLevelDescription}</p>
        </div>
      </div>

      {/* MDM Details */}
      {mdmDetails && methodology === 'MDM' && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className={`text-center p-2 rounded-lg ${mdmLevelColor(mdmDetails.problemComplexity)}`}>
            <p className="text-xs font-medium opacity-75">Problems</p>
            <p className="text-sm font-bold">{mdmDetails.problemComplexity}</p>
          </div>
          <div className={`text-center p-2 rounded-lg ${mdmLevelColor(mdmDetails.dataComplexity)}`}>
            <p className="text-xs font-medium opacity-75">Data</p>
            <p className="text-sm font-bold">{mdmDetails.dataComplexity}</p>
          </div>
          <div className={`text-center p-2 rounded-lg ${mdmLevelColor(mdmDetails.riskLevel)}`}>
            <p className="text-xs font-medium opacity-75">Risk</p>
            <p className="text-sm font-bold">{mdmDetails.riskLevel}</p>
          </div>
        </div>
      )}

      {/* Rationale */}
      {rationale && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">{rationale}</p>
      )}

      {/* Revenue Impact */}
      {revenueImpact && comparedToSelected !== 'MATCH' && comparedToSelected !== 'N/A' && (
        <div className={`p-3 rounded-lg ${comparedToSelected === 'UNDERCODED' ? 'bg-blue-100/50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/30' : 'bg-red-100/50 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/30'}`}>
          <div className="flex items-start gap-2">
            <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${comparedToSelected === 'UNDERCODED' ? 'text-blue-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-sm font-medium ${comparedToSelected === 'UNDERCODED' ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
              {revenueImpact}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
