import RiskBadge from './RiskBadge';
import AddendumGenerator from './AddendumGenerator';
import EMLevelCard from './EMLevelCard';
import FinancialImpact from './FinancialImpact';

// Stethoscope icon component
function StethoscopeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6v0a6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3" />
      <path d="M8 15v1a6 6 0 006 6v0a6 6 0 006-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}

function ExportButton() {
  const handleExport = () => {
    window.print();
  };

  return (
    <button
      onClick={handleExport}
      className="no-print inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-200 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all border border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export PDF
    </button>
  );
}

function CodeAnalysisCard({ analysis, index }) {
  return (
    <div
      className="border border-gray-200 dark:border-slate-600 rounded-xl p-5 print-friendly bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fadeInUp"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-inner">
            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
              {analysis.code}
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-800 dark:text-white block">
              {analysis.code}
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400">{analysis.codeDescription}</p>
          </div>
        </div>
        <RiskBadge level={analysis.status} />
      </div>

      {analysis.supportingElements?.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800/50">
          <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Supporting Elements Found
          </h4>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1.5">
            {analysis.supportingElements.map((element, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {element}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.missingElements?.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-100 dark:border-red-800/50">
          <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Missing Elements
          </h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1.5">
            {analysis.missingElements.map((element, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                {element}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.fixSuggestions?.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Suggested Fixes
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-2">
            {analysis.fixSuggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-blue-100/50 dark:hover:bg-blue-800/30 transition-colors">
                <svg
                  className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">Risk if submitted as-is:</span>
        <RiskBadge level={analysis.riskLevel === 'HIGH' ? 'LOW' : analysis.riskLevel === 'LOW' ? 'HIGH' : 'MEDIUM'} />
      </div>
    </div>
  );
}

export default function AnalysisReport({ report, note, selectedCptCodes }) {
  if (!report) return null;

  // Collect all missing elements and fix suggestions for addendum generation
  const allGaps = [];
  report.codeAnalysis?.forEach(analysis => {
    if (analysis.missingElements?.length > 0) {
      analysis.missingElements.forEach(element => {
        allGaps.push(`[${analysis.code}] ${element}`);
      });
    }
  });

  return (
    <div className="space-y-6 print-friendly animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-lg overflow-hidden relative">
        {/* Decorative gradient header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-healthcare-500 via-indigo-500 to-emerald-500"></div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-healthcare-500 to-indigo-600 flex items-center justify-center shadow-lg vitals-pulse">
              <StethoscopeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Defensibility Analysis Report
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Pre-claim documentation review
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton />
            <RiskBadge level={report.overallScore} size="lg" />
          </div>
        </div>

        {/* E/M Level Recommendation */}
        {report.emLevelRecommendation && (
          <div className="mb-6">
            <EMLevelCard
              emLevelRecommendation={report.emLevelRecommendation}
              selectedCptCodes={selectedCptCodes}
            />
          </div>
        )}

        {/* Financial Impact */}
        {report.financialImpact && (
          <div className="mb-6">
            <FinancialImpact
              financialImpact={report.financialImpact}
              codeAnalysis={report.codeAnalysis}
            />
          </div>
        )}

        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-5 mb-6 border border-slate-200/50 dark:border-slate-600/50">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Audit Risk Summary
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{report.overallRiskSummary}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <svg className="w-4 h-4 text-healthcare-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Code-by-Code Analysis
            <span className="ml-auto text-xs font-normal text-slate-400 dark:text-slate-500">
              {report.codeAnalysis?.length || 0} codes reviewed
            </span>
          </h3>
          {report.codeAnalysis?.map((analysis, idx) => (
            <CodeAnalysisCard key={idx} analysis={analysis} index={idx} />
          ))}
        </div>

        {report.generalRecommendations?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              General Recommendations
            </h3>
            <ul className="space-y-3">
              {report.generalRecommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 dark:to-transparent border-l-2 border-purple-400 dark:border-purple-500 animate-fadeInUp"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Smart Addendum Generator */}
        {allGaps.length > 0 && note && (
          <AddendumGenerator note={note} gaps={allGaps} />
        )}
      </div>

      <div className="text-center no-print animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
          <svg className="w-4 h-4 text-healthcare-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Generated by <span className="font-semibold text-gradient">DocDefend</span> - Documentation Defensibility QA Platform
          </span>
        </div>
      </div>
    </div>
  );
}
