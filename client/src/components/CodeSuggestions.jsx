import { useState } from 'react';
import { useApiKey, getAuthHeaders } from '../context/ApiKeyContext';

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
  const { apiKey } = useApiKey();

  const handleAnalyze = async () => {
    if (!note.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/suggest-codes', {
        method: 'POST',
        headers: getAuthHeaders(apiKey),
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get suggestions');
      }

      const data = await response.json();
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
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-5 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 dark:text-purple-200">Smart Code Suggestions</h3>
            <p className="text-xs text-purple-600 dark:text-purple-400">AI-powered code recommendations</p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !note.trim()}
          className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
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
            className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
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
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Suggested CPT Codes</h4>
                <div className="space-y-2">
                  {suggestions.cptCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-fadeInUp"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">CPT</span>
                          </span>
                          <div>
                            <span className="font-mono font-semibold text-slate-800 dark:text-white">{code.code}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">{code.description}</span>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${confidenceColors[code.confidence]}`}>
                          {code.confidence}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pl-10">{code.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ICD-10 Codes */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Suggested ICD-10 Codes</h4>
                <div className="space-y-2">
                  {suggestions.icd10Codes.map((code, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-fadeInUp"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">ICD</span>
                          </span>
                          <div>
                            <span className="font-mono font-semibold text-slate-800 dark:text-white">{code.code}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">{code.description}</span>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${confidenceColors[code.confidence]}`}>
                          {code.confidence}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pl-10">{code.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {suggestions.warnings?.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Warnings</h4>
                  <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                    {suggestions.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply Button */}
              <button
                onClick={handleApplySuggestions}
                className="w-full py-3 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 rounded-xl hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-900/50 dark:hover:to-indigo-900/50 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply High/Medium Confidence Codes
              </button>
            </>
          )}
        </div>
      )}

      {!suggestions && !loading && (
        <p className="text-sm text-purple-600 dark:text-purple-400">
          Click "Suggest Codes" to analyze the clinical note and get AI-powered code recommendations.
        </p>
      )}
    </div>
  );
}
