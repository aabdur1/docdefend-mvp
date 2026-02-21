import { useState } from 'react';
import { useApiKey, getAuthHeaders } from '../context/ApiKeyContext';
import { API_URL } from '../config';

const confidenceColors = {
  HIGH: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  LOW: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function CodeSuggestions({ note, onSelectCodes }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [applied, setApplied] = useState(false);
  const { apiKey } = useApiKey();

  const handleAnalyze = async () => {
    if (!note.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL + '/api/suggest-codes', {
        method: 'POST',
        headers: getAuthHeaders(apiKey),
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        let message = 'Failed to get suggestions';
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {}
        throw new Error(message);
      }

      const text = await response.text();
      if (!text) throw new Error('Empty response from server — is the backend running?');
      const data = JSON.parse(text);
      setSuggestions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestions = () => {
    if (!suggestions) return;

    const cptCodes = suggestions.cptCodes
      .filter(c => c.confidence !== 'LOW')
      .map(c => c.code);
    const icd10Codes = suggestions.icd10Codes
      .filter(c => c.confidence !== 'LOW')
      .map(c => c.code);

    onSelectCodes(cptCodes, icd10Codes);
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  };

  return (
    <div className="bg-healthcare-50 dark:bg-healthcare-900/20 rounded-xl border border-healthcare-200 dark:border-healthcare-800/50 p-5 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-healthcare-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold font-display text-slate-800 dark:text-white">Smart Code Suggestions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI-powered code recommendations</p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !note.trim()}
          className="px-4 py-2 text-sm font-medium bg-healthcare-500 hover:bg-healthcare-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Suggest Codes
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded p-3 text-sm text-red-700 dark:text-red-300 mb-3">
          {error}
        </div>
      )}

      {suggestions && (
        <div className="space-y-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-healthcare-600 dark:text-trace hover:text-healthcare-700 dark:hover:text-trace-glow"
          >
            <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {isExpanded ? 'Hide' : 'Show'} Suggestions
          </button>

          {isExpanded && (
            <>
              {/* CPT Codes */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Suggested CPT Codes</h4>
                <div className="space-y-2">
                  {suggestions.cptCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl p-3 sm:p-4 border border-[#D6C9A8] dark:border-instrument-border hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-fadeInUp"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">CPT</span>
                          </span>
                          <div className="min-w-0">
                            <span className="font-mono font-semibold text-slate-800 dark:text-white">{code.code}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 ml-2 break-words">{code.description}</span>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 self-start ${confidenceColors[code.confidence]}`}>
                          {code.confidence}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 sm:pl-10">{code.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ICD-10 Codes */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Suggested ICD-10 Codes</h4>
                <div className="space-y-2">
                  {suggestions.icd10Codes.map((code, idx) => (
                    <div
                      key={idx}
                      className="bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl p-3 sm:p-4 border border-[#D6C9A8] dark:border-instrument-border hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-fadeInUp"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">ICD</span>
                          </span>
                          <div className="min-w-0">
                            <span className="font-mono font-semibold text-slate-800 dark:text-white">{code.code}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 ml-2 break-words">{code.description}</span>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 self-start ${confidenceColors[code.confidence]}`}>
                          {code.confidence}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 sm:pl-10">{code.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {suggestions.warnings?.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                  <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Warnings</h4>
                  <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                    {suggestions.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply Button */}
              <div className="pt-2 border-t border-healthcare-200/50 dark:border-healthcare-800/30 mt-2">
                <button
                  onClick={handleApplySuggestions}
                  disabled={applied}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] ${
                    applied
                      ? 'bg-healthcare-300 text-white shadow-lg shadow-healthcare-300/30'
                      : 'bg-healthcare-500 hover:bg-healthcare-600 text-white shadow-lg shadow-healthcare-500/30 hover:shadow-xl hover:shadow-healthcare-500/40 btn-lift'
                  }`}
                >
                  {applied ? (
                    <>
                      <svg className="w-5 h-5 check-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Codes Applied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Apply High/Medium Confidence Codes
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {!suggestions && !loading && (
        <p className="text-sm text-healthcare-600 dark:text-trace-dim">
          Click "Suggest Codes" to analyze the clinical note and get AI-powered code recommendations.
        </p>
      )}
    </div>
  );
}
