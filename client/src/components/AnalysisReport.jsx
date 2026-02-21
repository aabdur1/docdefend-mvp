import RiskBadge from './RiskBadge';
import ScoreRing from './ScoreRing';
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
      className="no-print inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-700 dark:text-slate-200 hover:bg-[#E5DBBF] dark:hover:bg-instrument-bg-hover transition-all border border-[#D6C9A8]/50 dark:border-instrument-border/50 shadow-sm hover:shadow"
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
      className="border border-[#D6C9A8] dark:border-instrument-border rounded-xl p-5 print-friendly bg-[#F5EFE0] dark:bg-instrument-bg-raised shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fadeInUp"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-[#EDE6D3] dark:bg-instrument-bg-surface flex items-center justify-center shadow-inner flex-shrink-0">
            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
              {analysis.code}
            </span>
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-slate-800 dark:text-white block">
              {analysis.code}
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400 break-words">{analysis.codeDescription}</p>
          </div>
        </div>
        <RiskBadge level={analysis.status} />
      </div>

      {analysis.supportingElements?.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50">
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
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50">
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg p-4">
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

      <div className="mt-3 pt-3 border-t border-[#D6C9A8]/50 dark:border-instrument-border flex items-center justify-between">
        <span className="text-sm text-slate-500 dark:text-slate-400">Risk if submitted as-is:</span>
        <RiskBadge level={analysis.riskLevel === 'HIGH' ? 'LOW' : analysis.riskLevel === 'LOW' ? 'HIGH' : 'MEDIUM'} />
      </div>
    </div>
  );
}

const PAYER_NAMES = {
  united: 'United Healthcare',
  aetna: 'Aetna',
  bcbs: 'Blue Cross Blue Shield',
};

function PayerFindingsSection({ findings, payerName }) {
  if (!findings || findings.length === 0) return null;

  const statusIcon = (status) => {
    switch (status) {
      case 'MET':
        return (
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'PARTIALLY_MET':
        return (
          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const statusBadge = (status) => {
    const classes = {
      MET: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
      PARTIALLY_MET: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
      NOT_MET: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    };
    const labels = { MET: 'Met', PARTIALLY_MET: 'Partial', NOT_MET: 'Not Met' };
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${classes[status] || classes.NOT_MET}`}>
        {labels[status] || 'Not Met'}
      </span>
    );
  };

  const metCount = findings.filter(f => f.status === 'MET').length;
  const notMetCount = findings.filter(f => f.status === 'NOT_MET').length;

  return (
    <div className="rounded-xl border border-[#D6C9A8] dark:border-instrument-border bg-[#F5EFE0] dark:bg-instrument-bg-raised p-5 mb-6 animate-fadeInUp">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#EDE6D3] dark:bg-instrument-bg-surface flex items-center justify-center">
          <svg className="w-5 h-5 text-healthcare-500 dark:text-trace-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
            Payer-Specific Requirements
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {payerName} documentation rules beyond Medicare baseline
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {metCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
              {metCount} met
            </span>
          )}
          {notMetCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
              {notMetCount} gaps
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {findings.map((finding, idx) => (
          <div
            key={idx}
            className="bg-[#F5EFE0]/70 dark:bg-instrument-bg-raised/70 rounded-lg border border-[#D6C9A8]/50 dark:border-instrument-border/30 p-3 animate-fadeInUp"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="flex items-start gap-2.5">
              {statusIcon(finding.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium text-slate-800 dark:text-white">
                    {finding.rule}
                  </span>
                  {statusBadge(finding.status)}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {finding.detail}
                </p>
                {finding.status !== 'MET' && finding.impact && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-start gap-1">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {finding.impact}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalysisReport({ report, note, selectedCptCodes, selectedPayer }) {
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
      <div className="bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-2xl border border-[#D6C9A8] dark:border-instrument-border p-4 sm:p-6 shadow-card overflow-hidden relative">
        {/* Decorative gradient header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-healthcare-500"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-healthcare-500 flex items-center justify-center shadow-lg vitals-pulse flex-shrink-0">
              <StethoscopeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-800 dark:text-white">
                Defensibility Analysis Report
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Pre-claim documentation review
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <ExportButton />
            <ScoreRing score={report.overallScore} size={72} />
          </div>
        </div>

        {/* E/M Level Recommendation */}
        {report.emLevelRecommendation && (
          <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '100ms', opacity: 0 }}>
            <EMLevelCard
              emLevelRecommendation={report.emLevelRecommendation}
              selectedCptCodes={selectedCptCodes}
            />
          </div>
        )}

        {/* Financial Impact */}
        {report.financialImpact && (
          <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '200ms', opacity: 0 }}>
            <FinancialImpact
              financialImpact={report.financialImpact}
              codeAnalysis={report.codeAnalysis}
              selectedPayer={selectedPayer}
            />
          </div>
        )}

        {/* Payer-Specific Findings */}
        {report.payerSpecificFindings?.length > 0 && (
          <div className="animate-fadeInUp" style={{ animationDelay: '300ms', opacity: 0 }}>
            <PayerFindingsSection
              findings={report.payerSpecificFindings}
              payerName={report.payerName || PAYER_NAMES[selectedPayer] || selectedPayer}
            />
          </div>
        )}

        <div className="bg-[#EDE6D3] dark:bg-instrument-bg-surface rounded-xl p-5 mb-6 border border-[#D6C9A8]/50 dark:border-instrument-border/50 animate-fadeInUp" style={{ animationDelay: '400ms', opacity: 0 }}>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Audit Risk Summary
          </h3>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{report.overallRiskSummary}</p>
        </div>

        <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '500ms', opacity: 0 }}>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <svg className="w-4 h-4 text-healthcare-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Code-by-Code Analysis
            <span className="ml-auto text-xs font-normal text-slate-500 dark:text-slate-400">
              {report.codeAnalysis?.length || 0} codes reviewed
            </span>
          </h3>
          {report.codeAnalysis?.map((analysis, idx) => (
            <CodeAnalysisCard key={idx} analysis={analysis} index={idx} />
          ))}
        </div>

        {report.generalRecommendations?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#D6C9A8] dark:border-instrument-border animate-fadeInUp" style={{ animationDelay: '600ms', opacity: 0 }}>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-healthcare-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              General Recommendations
            </h3>
            <ul className="space-y-3">
              {report.generalRecommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 p-3 rounded-lg bg-healthcare-50 dark:bg-healthcare-900/20 border-l-2 border-healthcare-400 dark:border-healthcare-500 animate-fadeInUp"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <span className="w-5 h-5 rounded-full bg-healthcare-100 dark:bg-healthcare-900/50 flex items-center justify-center text-healthcare-600 dark:text-healthcare-400 text-xs font-bold flex-shrink-0">
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
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EDE6D3] dark:bg-instrument-bg-raised rounded-full">
          <svg className="w-4 h-4 text-healthcare-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Generated by <span className="font-semibold text-slate-800 dark:text-instrument-text">DocDefend</span> - Documentation Defensibility QA Platform
          </span>
        </div>
      </div>
    </div>
  );
}
