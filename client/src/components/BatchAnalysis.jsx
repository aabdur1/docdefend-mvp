import { useState, useRef } from 'react';
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

const confidenceColors = {
  HIGH: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  LOW: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const confidenceBadge = {
  HIGH: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-red-500',
};

function CodePills({ codes, onRemove }) {
  return (
    <div className="flex flex-wrap gap-1">
      {codes.map(code => (
        <span
          key={code}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-mono font-medium bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-700 dark:text-slate-300"
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

function createRow(overrides = {}) {
  return {
    id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    note: '',
    cptCodes: [],
    icd10Codes: [],
    status: 'pending',
    suggestions: null,
    suggestionsLoading: false,
    suggestionsError: null,
    ...overrides,
  };
}

export default function BatchAnalysis() {
  const [rows, setRows] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const { apiKey } = useApiKey();
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [batchResults, setBatchResults] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // Upload state
  const fileInputRef = useRef(null);
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    current: 0,
    total: 0,
    errors: [],
  });

  const addSampleNote = (sampleNote) => {
    setRows(prev => [...prev, createRow({ title: sampleNote.title, note: sampleNote.note })]);
  };

  const addBlankRow = () => {
    setRows(prev => [...prev, createRow({ title: `Custom Note ${prev.length + 1}` })]);
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

  // --- Multi-file upload ---
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset the input so the same files can be re-selected
    e.target.value = '';

    setUploadState({ isUploading: true, current: 0, total: files.length, errors: [] });
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      setUploadState(prev => ({ ...prev, current: i + 1 }));

      const formData = new FormData();
      formData.append('file', files[i]);

      try {
        const headers = {};
        if (apiKey) headers['x-api-key'] = apiKey;

        const uploadController = new AbortController();
        const uploadTimeout = setTimeout(() => uploadController.abort(), 30000);

        const response = await fetch(API_URL + '/api/upload', {
          method: 'POST',
          headers,
          signal: uploadController.signal,
          body: formData,
        });

        clearTimeout(uploadTimeout);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Upload failed');
        }

        // Create a new row with the uploaded content
        setRows(prev => [...prev, createRow({
          title: files[i].name,
          note: data.content || '',
        })]);
      } catch (err) {
        errors.push(`${files[i].name}: ${err.message}`);
      }
    }

    setUploadState(prev => ({ ...prev, isUploading: false, errors }));
  };

  const dismissUploadErrors = () => {
    setUploadState(prev => ({ ...prev, errors: [] }));
  };

  // --- AI Code Suggestions ---
  const handleSuggestCodes = async (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row || !row.note.trim()) return;

    updateRow(rowId, { suggestionsLoading: true, suggestionsError: null });

    try {
      const suggestController = new AbortController();
      const suggestTimeout = setTimeout(() => suggestController.abort(), 30000);

      const response = await fetch(API_URL + '/api/suggest-codes', {
        method: 'POST',
        headers: getAuthHeaders(apiKey),
        signal: suggestController.signal,
        body: JSON.stringify({ note: row.note }),
      });

      clearTimeout(suggestTimeout);

      if (!response.ok) {
        let message = 'Failed to get suggestions';
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {}
        throw new Error(message);
      }

      const text = await response.text();
      if (!text) throw new Error('Empty response from server');
      const data = JSON.parse(text);

      updateRow(rowId, { suggestions: data, suggestionsLoading: false });
    } catch (err) {
      updateRow(rowId, { suggestionsLoading: false, suggestionsError: err.name === 'AbortError' ? 'Request timed out. Please try again.' : err.message });
    }
  };

  const handleApplySuggestions = (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row?.suggestions) return;

    const newCpt = row.suggestions.cptCodes
      .filter(c => c.confidence !== 'LOW')
      .map(c => c.code);
    const newIcd = row.suggestions.icd10Codes
      .filter(c => c.confidence !== 'LOW')
      .map(c => c.code);

    updateRow(rowId, {
      cptCodes: [...new Set([...row.cptCodes, ...newCpt])],
      icd10Codes: [...new Set([...row.icd10Codes, ...newIcd])],
    });
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
      const batchController = new AbortController();
      const batchTimeout = setTimeout(() => batchController.abort(), 120000);

      const response = await fetch(API_URL + '/api/analyze-batch', {
        method: 'POST',
        headers: getAuthHeaders(apiKey),
        signal: batchController.signal,
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

      clearTimeout(batchTimeout);

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
      <div className="bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-2xl border border-[#D6C9A8]/50 dark:border-instrument-border/50 p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-healthcare-500 flex items-center justify-center text-white shadow-lg shadow-healthcare-500/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold font-display text-slate-800 dark:text-white">Batch Analysis</h2>
              <p className="text-[0.65rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">Analyze multiple notes at once</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-healthcare-100 dark:bg-healthcare-900/30 text-healthcare-600 dark:text-trace">
            {rows.length} note{rows.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Add notes section */}
        <div className="mb-4">
          <p className="text-base font-medium text-slate-600 dark:text-slate-400 mb-2">Add sample notes:</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {sampleNotes.map(sn => (
              <button
                key={sn.id}
                onClick={() => addSampleNote(sn)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-700 dark:text-slate-300 hover:bg-[#E5DBBF] dark:hover:bg-instrument-bg-hover transition-colors truncate max-w-[180px] sm:max-w-[220px]"
              >
                + {sn.title}
              </button>
            ))}
            <button
              onClick={addBlankRow}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-healthcare-100 dark:bg-healthcare-900/30 text-healthcare-600 dark:text-trace hover:bg-healthcare-200 dark:hover:bg-healthcare-900/50 transition-colors"
            >
              + Blank Note
            </button>
            {/* Upload Files button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xml,.ccd,.ccda,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadState.isUploading}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {uploadState.isUploading ? `Uploading ${uploadState.current}/${uploadState.total}...` : 'Upload Files'}
            </button>
          </div>
        </div>

        {/* Upload progress bar */}
        {uploadState.isUploading && (
          <div className="mb-4 animate-fadeIn">
            <div className="w-full h-2 bg-blue-100 dark:bg-blue-900/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${(uploadState.current / uploadState.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1 text-center">
              Uploading file {uploadState.current} of {uploadState.total}...
            </p>
          </div>
        )}

        {/* Upload errors */}
        {uploadState.errors.length > 0 && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-base font-medium text-red-700 dark:text-red-300 mb-1">Some files failed to upload:</p>
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-0.5">
                  {uploadState.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={dismissUploadErrors}
                className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Notes table */}
        {rows.length > 0 && (
          <div className="space-y-3 mb-4">
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className={`border rounded-xl p-4 transition-all ${
                  expandedRow === row.id
                    ? 'border-healthcare-300 dark:border-healthcare-700 bg-healthcare-50/30 dark:bg-healthcare-900/10'
                    : 'border-[#D6C9A8] dark:border-instrument-border bg-[#F5EFE0] dark:bg-instrument-bg-raised'
                }`}
              >
                {/* Row header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-600 dark:text-slate-400 text-sm flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => updateRow(row.id, { title: e.target.value })}
                      className="text-base font-medium text-slate-800 dark:text-white bg-transparent border-none outline-none flex-1 min-w-0"
                      placeholder="Note title"
                    />
                    {/* Status badge */}
                    {row.status === 'complete' && row.analysis && (
                      <RiskBadge level={row.analysis.overallScore} />
                    )}
                    {row.status === 'analyzing' && (
                      <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 animate-pulse">
                        Analyzing...
                      </span>
                    )}
                    {row.status === 'error' && (
                      <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                        Error
                      </span>
                    )}
                    {row.status === 'skipped' && (
                      <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-500 dark:text-slate-400">
                        Skipped
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                      aria-label={expandedRow === row.id ? 'Collapse note details' : 'Expand note details'}
                      className="p-1.5 rounded-lg hover:bg-[#EDE6D3] dark:hover:bg-instrument-bg-surface transition-colors"
                    >
                      <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedRow === row.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeRow(row.id)}
                      aria-label="Remove note from batch"
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
                      className="w-full text-base border border-[#D6C9A8] dark:border-instrument-border rounded-lg p-3 bg-[#F5EFE0] dark:bg-instrument-bg text-slate-800 dark:text-slate-200 resize-y"
                      placeholder="Paste or type clinical note..."
                    />

                    {/* CPT Code selection */}
                    <div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">CPT Codes</p>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {CPT_CODES.map(code => (
                          <button
                            key={code}
                            onClick={() => toggleCode(row.id, 'cpt', code)}
                            className={`px-2.5 py-1.5 sm:py-1 rounded text-sm font-mono font-medium transition-colors ${
                              row.cptCodes.includes(code)
                                ? 'bg-healthcare-500 text-white'
                                : 'bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-600 dark:text-slate-400 hover:bg-[#E5DBBF] dark:hover:bg-instrument-bg-hover'
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
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">ICD-10 Codes</p>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {ICD10_CODES.map(code => (
                          <button
                            key={code}
                            onClick={() => toggleCode(row.id, 'icd10', code)}
                            className={`px-2.5 py-1.5 sm:py-1 rounded text-sm font-mono font-medium transition-colors ${
                              row.icd10Codes.includes(code)
                                ? 'bg-healthcare-500 text-white'
                                : 'bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-600 dark:text-slate-400 hover:bg-[#E5DBBF] dark:hover:bg-instrument-bg-hover'
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

                    {/* AI Code Suggestions */}
                    <div className="border-t border-[#D6C9A8]/50 dark:border-instrument-border/50 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-healthcare-500 dark:text-trace" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">AI Code Suggestions</p>
                        </div>
                        <button
                          onClick={() => handleSuggestCodes(row.id)}
                          disabled={!row.note.trim() || row.suggestionsLoading}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-healthcare-500 hover:bg-healthcare-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                        >
                          {row.suggestionsLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Suggest Codes
                            </>
                          )}
                        </button>
                      </div>

                      {/* Suggestions error */}
                      {row.suggestionsError && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-2 text-sm text-red-700 dark:text-red-300 mb-2">
                          {row.suggestionsError}
                        </div>
                      )}

                      {/* Suggestion pills */}
                      {row.suggestions && (
                        <div className="space-y-2 animate-fadeIn">
                          {/* CPT suggestions */}
                          {row.suggestions.cptCodes?.length > 0 && (
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Suggested CPT</p>
                              <div className="flex flex-wrap gap-1.5">
                                {row.suggestions.cptCodes.map((s, i) => (
                                  <span
                                    key={i}
                                    className={`group relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-mono font-medium cursor-default ${confidenceColors[s.confidence]}`}
                                    title={`${s.description}\n\nRationale: ${s.rationale}`}
                                  >
                                    <span className={`w-4 h-4 rounded-full ${confidenceBadge[s.confidence]} text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0`}>
                                      {s.confidence[0]}
                                    </span>
                                    {s.code}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ICD-10 suggestions */}
                          {row.suggestions.icd10Codes?.length > 0 && (
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Suggested ICD-10</p>
                              <div className="flex flex-wrap gap-1.5">
                                {row.suggestions.icd10Codes.map((s, i) => (
                                  <span
                                    key={i}
                                    className={`group relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-mono font-medium cursor-default ${confidenceColors[s.confidence]}`}
                                    title={`${s.description}\n\nRationale: ${s.rationale}`}
                                  >
                                    <span className={`w-4 h-4 rounded-full ${confidenceBadge[s.confidence]} text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0`}>
                                      {s.confidence[0]}
                                    </span>
                                    {s.code}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Apply button */}
                          <button
                            onClick={() => handleApplySuggestions(row.id)}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Apply High/Medium Codes
                          </button>
                        </div>
                      )}

                      {!row.suggestions && !row.suggestionsLoading && !row.suggestionsError && (
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                          Click "Suggest Codes" to get AI-powered code recommendations for this note.
                        </p>
                      )}
                    </div>

                    {/* Show full analysis report if complete */}
                    {row.status === 'complete' && row.analysis && (
                      <div className="mt-4 border-t border-[#D6C9A8] dark:border-instrument-border pt-4">
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
            className="flex-1 bg-healthcare-500 hover:bg-healthcare-600 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-healthcare-500/30 hover:shadow-xl"
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
            className="px-6 py-3 border-2 border-[#D6C9A8] dark:border-instrument-border text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-[#EDE6D3] dark:hover:bg-instrument-bg-surface transition-all"
          >
            Clear All
          </button>
        </div>

        {/* Progress bar during analysis */}
        {analyzing && progress.total > 0 && (
          <div className="mt-4">
            <div className="w-full h-2 bg-[#EDE6D3] dark:bg-instrument-bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-healthcare-500 dark:bg-trace rounded-full transition-all duration-500"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">
              Processing note {progress.current} of {progress.total}...
            </p>
          </div>
        )}
      </div>

      {/* Batch Summary */}
      {batchResults?.summary && (
        <div className="bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-2xl border border-[#D6C9A8]/50 dark:border-instrument-border/50 p-6 shadow-card animate-fadeInUp">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold font-display text-slate-800 dark:text-white">Batch Summary</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {batchResults.summary.completed} of {batchResults.summary.total} notes analyzed
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-xl bg-[#EDE6D3] dark:bg-instrument-bg-surface/50">
              <p className="text-3xl font-bold font-mono text-slate-800 dark:text-white">{batchResults.summary.total}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
              <p className="text-3xl font-bold font-mono text-green-600 dark:text-green-400">{batchResults.summary.highCount}</p>
              <p className="text-sm text-green-600 dark:text-green-400">High Score</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <p className="text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">{batchResults.summary.mediumCount}</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">Medium Score</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <p className="text-3xl font-bold font-mono text-red-600 dark:text-red-400">{batchResults.summary.lowCount}</p>
              <p className="text-sm text-red-600 dark:text-red-400">Low Score</p>
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
        <div className="bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-2xl border border-[#D6C9A8]/50 dark:border-instrument-border/50 p-6 sm:p-10 text-center shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-healthcare-100 dark:bg-healthcare-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-healthcare-500 dark:text-trace" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold font-display text-slate-800 dark:text-white mb-2">No Notes Added</h3>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Add sample notes, upload files, or create blank notes to start batch analysis. Select codes for each note, then analyze all at once.
          </p>
        </div>
      )}
    </div>
  );
}
