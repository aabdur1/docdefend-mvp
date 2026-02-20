import { useState } from 'react';
import sampleNotes from '../data/sampleNotes.json';
import AnalysisReport from './AnalysisReport';
import RiskBadge from './RiskBadge';
import { useApiKey, getAuthHeaders } from '../context/ApiKeyContext';
import { API_URL } from '../config';

const CPT_CODES = [
  '99213', '99214', '99215', '99203', '99204', '99205',
  '64483', '64490', '20610', '77003', '64635', '96372',
];

const ICD10_CODES = [
  'M54.5', 'M54.2', 'M47.816', 'M51.16', 'G89.29', 'M79.3', 'G89.4', 'M54.41', 'M54.42',
];

function CodePills({ codes, onRemove }) {
  return (
    <div className="flex flex-wrap gap-1">
      {codes.map(code => (
        <span
          key={code}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
        >
          {code}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(code); }}
            className="hover:text-red-500 transition-colors"
          >
            x
          </button>
        </span>
      ))}
    </div>
  );
}

export default function BatchAnalysis() {
  const [rows, setRows] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const { apiKey } = useApiKey();
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [batchResults, setBatchResults] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const addSampleNote = (sampleNote) => {
    setRows(prev => [
      ...prev,
      {
        id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: sampleNote.title,
        note: sampleNote.note,
        cptCodes: [],
        icd10Codes: [],
        status: 'pending',
      },
    ]);
  };

  const addBlankRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: `Custom Note ${prev.length + 1}`,
        note: '',
        cptCodes: [],
        icd10Codes: [],
        status: 'pending',
      },
    ]);
  };

  const removeRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id, updates) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const toggleCode = (rowId, codeType, code) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const field = codeType === 'cpt' ? 'cptCodes' : 'icd10Codes';
      const current = r[field];
      return {
        ...r,
        [field]: current.includes(code)
          ? current.filter(c => c !== code)
          : [...current, code],
      };
    }));
  };

  const canAnalyze = rows.length > 0 && rows.some(r =>
    r.note.trim() && r.cptCodes.length > 0 && r.icd10Codes.length > 0
  );

  const handleAnalyzeAll = async () => {
    const validRows = rows.filter(r =>
      r.note.trim() && r.cptCodes.length > 0 && r.icd10Codes.length > 0
    );

    if (validRows.length === 0) return;

    setAnalyzing(true);
    setProgress({ current: 0, total: validRows.length });
    setBatchResults(null);
    setExpandedRow(null);

    // Mark all valid rows as analyzing
    setRows(prev => prev.map(r => ({
      ...r,
      status: validRows.find(v => v.id === r.id) ? 'analyzing' : r.status === 'pending' ? 'skipped' : r.status,
    })));

    try {
      const response = await fetch(API_URL + '/api/analyze-batch', {
        method: 'POST',
        headers: getAuthHeaders(apiKey),
        body: JSON.stringify({
          notes: validRows.map(r => ({
            id: r.id,
            title: r.title,
            note: r.note,
            cptCodes: r.cptCodes,
            icd10Codes: r.icd10Codes,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Batch analysis failed');
      }

      const data = await response.json();

      // Update row statuses based on results
      setRows(prev => prev.map(r => {
        const result = data.results?.find(res => res.id === r.id);
        if (!result) return r;
        return {
          ...r,
          status: result.status === 'complete' ? 'complete' : 'error',
          analysis: result.analysis || null,
          error: result.error || null,
        };
      }));

      setBatchResults(data);
      setProgress({ current: validRows.length, total: validRows.length });
    } catch (err) {
      setRows(prev => prev.map(r =>
        r.status === 'analyzing' ? { ...r, status: 'error', error: err.message } : r
      ));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setRows([]);
    setBatchResults(null);
    setExpandedRow(null);
    setProgress({ current: 0, total: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Batch header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Batch Analysis</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Analyze multiple notes at once</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
            {rows.length} note{rows.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Add notes section */}
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Add sample notes:</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {sampleNotes.map(sn => (
              <button
                key={sn.id}
                onClick={() => addSampleNote(sn)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors truncate max-w-[160px] sm:max-w-[200px]"
              >
                + {sn.title}
              </button>
            ))}
            <button
              onClick={addBlankRow}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
            >
              + Blank Note
            </button>
          </div>
        </div>

        {/* Notes table */}
        {rows.length > 0 && (
          <div className="space-y-3 mb-4">
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className={`border rounded-xl p-4 transition-all ${
                  expandedRow === row.id
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-900/10'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                {/* Row header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => updateRow(row.id, { title: e.target.value })}
                      className="text-sm font-medium text-slate-800 dark:text-white bg-transparent border-none outline-none flex-1 min-w-0"
                      placeholder="Note title"
                    />
                    {/* Status badge */}
                    {row.status === 'complete' && row.analysis && (
                      <RiskBadge level={row.analysis.overallScore} />
                    )}
                    {row.status === 'analyzing' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 animate-pulse">
                        Analyzing...
                      </span>
                    )}
                    {row.status === 'error' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                        Error
                      </span>
                    )}
                    {row.status === 'skipped' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        Skipped
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedRow === row.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeRow(row.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {expandedRow === row.id && (
                  <div className="mt-3 space-y-3 animate-fadeIn">
                    {/* Note text */}
                    <textarea
                      value={row.note}
                      onChange={(e) => updateRow(row.id, { note: e.target.value })}
                      rows={4}
                      className="w-full text-sm border border-gray-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-y"
                      placeholder="Paste or type clinical note..."
                    />

                    {/* CPT Code selection */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">CPT Codes</p>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {CPT_CODES.map(code => (
                          <button
                            key={code}
                            onClick={() => toggleCode(row.id, 'cpt', code)}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                              row.cptCodes.includes(code)
                                ? 'bg-healthcare-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                      {row.cptCodes.length > 0 && (
                        <CodePills codes={row.cptCodes} onRemove={(c) => toggleCode(row.id, 'cpt', c)} />
                      )}
                    </div>

                    {/* ICD-10 Code selection */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">ICD-10 Codes</p>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {ICD10_CODES.map(code => (
                          <button
                            key={code}
                            onClick={() => toggleCode(row.id, 'icd10', code)}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                              row.icd10Codes.includes(code)
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                      {row.icd10Codes.length > 0 && (
                        <CodePills codes={row.icd10Codes} onRemove={(c) => toggleCode(row.id, 'icd10', c)} />
                      )}
                    </div>

                    {/* Show full analysis report if complete */}
                    {row.status === 'complete' && row.analysis && (
                      <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
                        <AnalysisReport report={row.analysis} note={row.note} />
                      </div>
                    )}

                    {row.status === 'error' && row.error && (
                      <p className="text-sm text-red-600 dark:text-red-400">{row.error}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyzeAll}
            disabled={!canAnalyze || analyzing}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl"
          >
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing {progress.current}/{progress.total}...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Analyze All ({rows.filter(r => r.note.trim() && r.cptCodes.length > 0 && r.icd10Codes.length > 0).length} ready)
              </span>
            )}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 border-2 border-gray-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
          >
            Clear All
          </button>
        </div>

        {/* Progress bar during analysis */}
        {analyzing && progress.total > 0 && (
          <div className="mt-4">
            <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
              Processing note {progress.current} of {progress.total}...
            </p>
          </div>
        )}
      </div>

      {/* Batch Summary */}
      {batchResults?.summary && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-6 shadow-xl animate-fadeInUp">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Batch Summary</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {batchResults.summary.completed} of {batchResults.summary.total} notes analyzed
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{batchResults.summary.total}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{batchResults.summary.highCount}</p>
              <p className="text-xs text-green-600 dark:text-green-400">High Score</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{batchResults.summary.mediumCount}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Medium Score</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{batchResults.summary.lowCount}</p>
              <p className="text-xs text-red-600 dark:text-red-400">Low Score</p>
            </div>
          </div>

          {batchResults.summary.errors > 0 && (
            <p className="mt-3 text-sm text-red-500 dark:text-red-400">
              {batchResults.summary.errors} note(s) failed to analyze.
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-6 sm:p-10 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No Notes Added</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Add sample notes or create blank notes to start batch analysis. Select codes for each note, then analyze all at once.
          </p>
        </div>
      )}
    </div>
  );
}
