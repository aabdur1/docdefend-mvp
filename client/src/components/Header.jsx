import ApiKeyInput from './ApiKeyInput';

export default function Header({ darkMode, onToggleDarkMode, onOpenDashboard, analysisCount = 0, batchMode, onToggleBatchMode }) {
  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-700/50 no-print sticky top-0 z-40 animate-fadeInDown">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-healthcare-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative w-11 h-11 bg-gradient-to-br from-healthcare-500 to-healthcare-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                <span className="text-2xl">💊</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient flex items-center gap-1">
                DocDefend
                <span className="text-red-500 text-sm">✚</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">CLINICAL DOCUMENTATION QA</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
              {/* Heartbeat icon */}
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h4l3-9 4 18 3-9h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">System Active</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            {/* API Key Input */}
            <ApiKeyInput />

            {/* Batch Mode Toggle */}
            <button
              type="button"
              onClick={onToggleBatchMode}
              className={`relative px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-105 active:scale-95 border ${
                batchMode
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-400/50 shadow-lg shadow-purple-500/30'
                  : 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/40 dark:hover:to-indigo-900/40'
              }`}
              aria-label="Toggle batch mode"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Batch
              </span>
            </button>

            {/* Dashboard Button */}
            <button
              type="button"
              onClick={onOpenDashboard}
              className="relative p-2.5 rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 hover:from-indigo-200 hover:to-purple-200 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all duration-300 hover:scale-105 active:scale-95 group border border-indigo-200/50 dark:border-indigo-800/50"
              aria-label="Open dashboard"
            >
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {analysisCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-scaleIn">
                  {analysisCount > 9 ? '9+' : analysisCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="relative p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-300 hover:scale-105 active:scale-95 group"
              aria-label="Toggle dark mode"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 dark:from-blue-400 dark:to-purple-500 transition-opacity"></div>
              {darkMode ? (
                <svg className="w-5 h-5 text-yellow-500 transform transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-300 transform transition-transform group-hover:-rotate-12" fill="currentColor" viewBox="0 0 20 20">
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
