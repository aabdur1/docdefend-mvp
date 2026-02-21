import { useState } from 'react';
import { useApiKey, getAuthHeaders } from '../context/ApiKeyContext';
import { API_URL } from '../config';

export default function AddendumGenerator({ note, gaps }) {
  const [loading, setLoading] = useState(false);
  const [addendum, setAddendum] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const { apiKey } = useApiKey();

  const handleGenerate = async () => {
    if (!gaps?.length) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL + '/api/generate-addendum', {
        method: 'POST',
        headers: getAuthHeaders(apiKey),
        body: JSON.stringify({ note, gaps }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate addendum');
      }

      const data = await response.json();
      setAddendum(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!addendum?.addendumText) return;

    try {
      await navigator.clipboard.writeText(addendum.addendumText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!gaps?.length) return null;

  return (
    <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-5 shadow-sm animate-fadeInUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold font-display text-emerald-900 dark:text-emerald-200">Smart Addendum Generator</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Create compliant documentation fixes</p>
          </div>
        </div>
        {!addendum && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Generate Addendum
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded p-3 text-sm text-red-700 dark:text-red-300 mb-3">
          {error}
        </div>
      )}

      {!addendum && !loading && (
        <div className="mb-3">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
            {gaps.length} documentation gap{gaps.length > 1 ? 's' : ''} identified. Generate a compliant addendum to address:
          </p>
          <ul className="text-sm text-emerald-600 dark:text-emerald-400 space-y-1">
            {gaps.slice(0, 5).map((gap, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                {gap}
              </li>
            ))}
            {gaps.length > 5 && (
              <li className="text-emerald-500">...and {gaps.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      {addendum && (
        <div className="space-y-4">
          {/* Addendum Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Generated Addendum</h4>
              <button
                onClick={handleCopy}
                className={`px-3 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-[#EDE6D3] text-slate-600 hover:bg-[#E5DBBF] dark:bg-instrument-bg-surface dark:text-slate-300 dark:hover:bg-instrument-bg-hover'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
            <pre className="bg-[#F5EFE0] dark:bg-instrument-bg-raised border border-[#D6C9A8] dark:border-instrument-border rounded-xl p-4 sm:p-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words font-mono overflow-x-auto shadow-inner animate-fadeIn">
              {addendum.addendumText}
            </pre>
          </div>

          {/* Instructions */}
          {addendum.instructions?.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">Provider Instructions</h4>
              <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                {addendum.instructions.map((instruction, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">{idx + 1}.</span>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Elements Addressed */}
          {addendum.elementsAddressed?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold font-display text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Elements Addressed
              </h4>
              <div className="flex flex-wrap gap-2">
                {addendum.elementsAddressed.map((element, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full shadow-sm animate-scaleIn"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {element}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Regenerate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Regenerate Addendum
          </button>
        </div>
      )}
    </div>
  );
}
