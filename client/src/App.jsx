import { useState, useEffect } from 'react';
import Header from './components/Header';
import NoteSelector from './components/NoteSelector';
import CodeSelector from './components/CodeSelector';
import PayerSelector from './components/PayerSelector';
import CodeSuggestions from './components/CodeSuggestions';
import TemplateLibrary from './components/TemplateLibrary';
import AnalysisReport from './components/AnalysisReport';
import BatchAnalysis from './components/BatchAnalysis';
import { ToastProvider, useToast } from './components/Toast';
import Confetti from './components/Confetti';
import Dashboard from './components/Dashboard';
import EKGLine from './components/EKGLine';
import { ApiKeyProvider, useApiKey, getAuthHeaders } from './context/ApiKeyContext';
import { API_URL } from './config';

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
      {/* Single spinning pill */}
      <div className="relative mb-6">
        {/* Glow effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-healthcare-400/20 to-indigo-400/20 blur-xl animate-pulse"></div>
        </div>

        {/* Spinning pill */}
        <div className="relative text-6xl animate-rotatePill drop-shadow-xl">
          💊
        </div>
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
        Analyzing Documentation
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        AI is reviewing your clinical note for defensibility
      </p>

      {/* EKG Heartbeat Line */}
      <div className="w-full max-w-sm">
        <EKGLine className="opacity-70" />
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
          This may take a few moments...
        </p>
      </div>
    </div>
  );
}

function ErrorMessage({ message, onDismiss }) {
  return (
    <div className="animate-scaleIn bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 flex items-start gap-4 shadow-lg shadow-red-500/10">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-red-800 dark:text-red-300 font-semibold">Analysis Error</p>
        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
      >
        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="animate-fadeIn bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 sm:p-10 text-center shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
      {/* Stethoscope icon */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-healthcare-500/20 to-indigo-500/20 rounded-2xl animate-pulse"></div>
        <div className="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center">
          <svg className="w-12 h-12 text-healthcare-500 dark:text-healthcare-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3" />
            <path d="M8 15v1a6 6 0 006 6 6 6 0 006-6v-4" />
            <circle cx="20" cy="10" r="2" />
          </svg>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Ready for Analysis</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
        Select a clinical note and billing codes to generate your defensibility report.
      </p>

      {/* Steps indicator */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
          <span className="w-5 h-5 rounded-full bg-healthcare-100 dark:bg-healthcare-900/30 text-healthcare-600 dark:text-healthcare-400 flex items-center justify-center font-bold">1</span>
          <span>Note</span>
        </div>
        <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">2</span>
          <span>Codes</span>
        </div>
        <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">3</span>
          <span>Report</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3" />
          <path d="M8 15v1a6 6 0 006 6 6 6 0 006-6v-4" />
          <circle cx="20" cy="10" r="2" />
        </svg>
        <span>Powered by Claude AI</span>
      </div>
    </div>
  );
}

function AppContent() {
  const [darkMode, setDarkMode] = useState(false);
  const [note, setNote] = useState('');
  const [selectedCptCodes, setSelectedCptCodes] = useState([]);
  const [selectedIcd10Codes, setSelectedIcd10Codes] = useState([]);
  const [selectedPayer, setSelectedPayer] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [batchMode, setBatchMode] = useState(false);
  const toast = useToast();
  const { apiKey } = useApiKey();

  // Load analysis history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('analysisHistory');
    if (saved) {
      try {
        setAnalysisHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load analysis history:', e);
      }
    }
  }, []);

  // Reset confetti after it plays
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(JSON.parse(saved));
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const canAnalyze = note.trim() && selectedCptCodes.length > 0 && selectedIcd10Codes.length > 0;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch(API_URL + '/api/analyze', {
        method: 'POST',
        headers: getAuthHeaders(apiKey),
        body: JSON.stringify({
          note,
          cptCodes: selectedCptCodes,
          icd10Codes: selectedIcd10Codes,
          payerId: selectedPayer || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setReport(data);

      // Save to history
      const historyEntry = {
        id: Date.now(),
        title: `Analysis - ${selectedCptCodes.join(', ')}`,
        codes: selectedCptCodes.length + selectedIcd10Codes.length,
        date: new Date().toLocaleDateString(),
        score: data.overallScore,
        payer: selectedPayer || 'medicare',
      };
      const newHistory = [...analysisHistory, historyEntry].slice(-50); // Keep last 50
      setAnalysisHistory(newHistory);
      localStorage.setItem('analysisHistory', JSON.stringify(newHistory));

      // Show success feedback
      if (data.overallScore === 'HIGH') {
        setShowConfetti(true);
        toast.success('Excellent! High defensibility score achieved.', 'Analysis Complete');
      } else if (data.overallScore === 'MEDIUM') {
        toast.warning('Documentation has some gaps to address.', 'Analysis Complete');
      } else {
        toast.error('Documentation needs significant improvements.', 'Analysis Complete');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, 'Analysis Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setNote('');
    setSelectedCptCodes([]);
    setSelectedIcd10Codes([]);
    setSelectedPayer(null);
    setReport(null);
    setError(null);
  };

  const handleSelectSuggestedCodes = (cptCodes, icd10Codes) => {
    setSelectedCptCodes(prev => [...new Set([...prev, ...cptCodes])]);
    setSelectedIcd10Codes(prev => [...new Set([...prev, ...icd10Codes])]);
  };

  const handleSelectTemplate = (templateText) => {
    setNote(templateText);
  };

  return (
    <div className="min-h-screen bg-gradient-mesh medical-pattern bg-gray-50 dark:bg-slate-900 w-full max-w-full">
      <Confetti active={showConfetti} duration={3000} />

      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenDashboard={() => setDashboardOpen(true)}
        analysisCount={analysisHistory.length}
        batchMode={batchMode}
        onToggleBatchMode={() => setBatchMode(prev => !prev)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {batchMode ? (
          <BatchAnalysis />
        ) : (
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-full">
            {/* Left Column - Input */}
            <div className="space-y-6 no-print min-w-0">
              {/* Clinical Note Card */}
              <div className="animate-fadeInUp stagger-1 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 card-hover">
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-healthcare-500 to-healthcare-600 flex items-center justify-center text-white shadow-lg shadow-healthcare-500/30 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Clinical Note</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Patient documentation</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTemplateLibraryOpen(true)}
                    className="group px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all duration-300 flex items-center gap-2 font-medium border border-indigo-200/50 dark:border-indigo-800/50 flex-shrink-0"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    <span className="hidden sm:inline">Templates</span>
                  </button>
                </div>
                <NoteSelector value={note} onChange={setNote} />
              </div>

              {/* Smart Code Suggestions */}
              {note.trim() && (
                <div className="animate-fadeInUp">
                  <CodeSuggestions note={note} onSelectCodes={handleSelectSuggestedCodes} />
                </div>
              )}

              {/* Billing Codes Card */}
              <div className="animate-fadeInUp stagger-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 card-hover">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Billing Codes</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">CPT & ICD-10 selection</p>
                  </div>
                </div>
                <CodeSelector
                  selectedCptCodes={selectedCptCodes}
                  onCptChange={setSelectedCptCodes}
                  selectedIcd10Codes={selectedIcd10Codes}
                  onIcd10Change={setSelectedIcd10Codes}
                />
              </div>

              {/* Payer Selection */}
              <div className="animate-fadeInUp stagger-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 card-hover">
                <PayerSelector
                  selectedPayer={selectedPayer}
                  onPayerChange={setSelectedPayer}
                />
              </div>

              {/* Action Buttons */}
              <div className="animate-fadeInUp stagger-3 flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze || loading}
                  className="group relative flex-1 bg-gradient-to-r from-healthcare-600 to-healthcare-700 hover:from-healthcare-700 hover:to-healthcare-800 text-white py-4 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-healthcare-500/30 hover:shadow-xl hover:shadow-healthcare-500/40 disabled:shadow-none overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Analyze Documentation
                      </>
                    )}
                  </span>
                  {!loading && canAnalyze && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-4 border-2 border-gray-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-500 transition-all duration-300 active:scale-95"
                >
                  Reset
                </button>
              </div>

              {!canAnalyze && !loading && (
                <p className="animate-fadeIn text-sm text-slate-500 dark:text-slate-400 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl py-3 px-4 border border-slate-200/50 dark:border-slate-700/50">
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Enter a clinical note and select at least one CPT and ICD-10 code to analyze
                  </span>
                </p>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="lg:sticky lg:top-24 lg:self-start min-w-0">
              {loading && <LoadingSpinner />}
              {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
              {report && !loading && (
                <div className="animate-slideInRight">
                  <AnalysisReport
                    report={report}
                    note={note}
                    selectedCptCodes={selectedCptCodes}
                    selectedPayer={selectedPayer}
                  />
                </div>
              )}
              {!report && !loading && !error && <EmptyState />}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200/50 dark:border-slate-700/50 mt-16 py-8 no-print bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-healthcare-500 to-healthcare-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">💊</span>
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  DocDefend<span className="text-red-500 text-xs">✚</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Clinical Documentation QA Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <span>🏥</span>
                <span>Built for small medical practices</span>
              </div>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 hidden sm:block"></div>
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
                ⚠️ Demo only • Synthetic data • Not for clinical use
              </p>
            </div>
          </div>
        </div>
      </footer>

      <TemplateLibrary
        isOpen={templateLibraryOpen}
        onClose={() => setTemplateLibraryOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <Dashboard
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        analysisHistory={analysisHistory}
      />
    </div>
  );
}

export default function App() {
  return (
    <ApiKeyProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ApiKeyProvider>
  );
}
