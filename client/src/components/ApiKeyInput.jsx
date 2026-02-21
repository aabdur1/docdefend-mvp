import { useState } from 'react';
import { useApiKey } from '../context/ApiKeyContext';

export default function ApiKeyInput() {
  const { apiKey, setApiKey } = useApiKey();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    setApiKey(inputValue.trim());
    setIsOpen(false);
  };

  const handleClear = () => {
    setApiKey('');
    setInputValue('');
  };

  const maskedKey = apiKey ? `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}` : '';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setInputValue(apiKey);
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-105 active:scale-95 border ${
          apiKey
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50'
            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50 animate-pulse'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <span className="hidden sm:inline">{apiKey ? 'API Key Set' : 'Add API Key'}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl border border-[#D6C9A8] dark:border-instrument-border shadow-2xl p-4">
            <h3 className="text-base font-semibold font-display text-slate-800 dark:text-white mb-1">Anthropic API Key</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Your key is stored locally in your browser and never saved on any server.
            </p>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 pr-10 text-sm bg-[#EDE6D3] dark:bg-instrument-bg border border-[#D6C9A8] dark:border-instrument-border rounded-lg focus:ring-2 focus:ring-healthcare-500 focus:border-transparent outline-none text-slate-800 dark:text-white placeholder-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showKey ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={!inputValue.trim()}
                className="flex-1 px-3 py-1.5 bg-healthcare-500 hover:bg-healthcare-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                Save
              </button>
              {apiKey && (
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {apiKey && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Key saved: {maskedKey}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
