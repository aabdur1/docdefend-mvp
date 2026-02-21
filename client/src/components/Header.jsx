import ApiKeyInput from './ApiKeyInput';

export default function Header({ darkMode, onToggleDarkMode, onOpenDashboard, analysisCount = 0, batchMode, onToggleBatchMode }) {
  const navBtn = 'px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 bg-[#F5EFE0] text-slate-700 border-[#C4B48E] hover:bg-[#E5DBBF] dark:bg-instrument-bg-raised dark:text-instrument-text dark:border-instrument-border dark:hover:bg-instrument-bg-hover btn-lift';
  const navBtnIcon = 'p-2.5 rounded-xl text-sm border transition-all duration-200 bg-[#F5EFE0] text-slate-700 border-[#C4B48E] hover:bg-[#E5DBBF] dark:bg-instrument-bg-raised dark:text-instrument-text dark:border-instrument-border dark:hover:bg-instrument-bg-hover btn-lift';

  return (
    <header className="bg-[#EDE6D3] dark:bg-instrument-bg-surface border-b border-[#D6C9A8] dark:border-instrument-border no-print sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-healthcare-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-3xl">💊</span>
            </div>
            <div>
              <h1 className="font-semibold font-display text-2xl sm:text-3xl text-slate-800 dark:text-instrument-text leading-none flex items-center gap-1">
                DocDefend<span className="text-red-500 text-sm">✚</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">Clinical Documentation QA</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* System Active */}
            <div className={`hidden md:flex items-center gap-2 ${navBtn}`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h4l3-9 4 18 3-9h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>System Active</span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-trace opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-trace"></span>
              </span>
            </div>

            {/* API Key Input */}
            <ApiKeyInput />

            {/* Batch Mode Toggle */}
            <button
              type="button"
              onClick={onToggleBatchMode}
              className={batchMode
                ? 'px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 bg-healthcare-500 text-white border-healthcare-600 shadow-inner dark:bg-trace dark:text-instrument-bg dark:border-trace-dim'
                : navBtn
              }
              aria-label="Toggle batch mode"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="hidden sm:inline">Batch</span>
              </span>
            </button>

            {/* Dashboard Button */}
            <button
              type="button"
              onClick={onOpenDashboard}
              className={`relative ${navBtnIcon}`}
              aria-label="Open dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {analysisCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-healthcare-500 dark:bg-trace text-white dark:text-instrument-bg text-xs font-bold rounded-full flex items-center justify-center">
                  {analysisCount > 9 ? '9+' : analysisCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className={navBtnIcon}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
