import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiKey } from '../context/ApiKeyContext';
import PillIcon from './PillIcon';

export default function LoginPage() {
  const { login, logout } = useAuth();
  const { setApiKey } = useApiKey();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showApiKeyMode, setShowApiKeyMode] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [slowLogin, setSlowLogin] = useState(false);

  useEffect(() => {
    if (!sending) { setSlowLogin(false); return; }
    const timer = setTimeout(() => setSlowLogin(true), 5000);
    return () => clearTimeout(timer);
  }, [sending]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setSending(true);
    setError(null);

    try {
      await login(username.trim(), password.trim());
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleApiKeySave = () => {
    if (!apiKeyInput.trim()) return;
    logout(); // Clear any existing JWT to avoid ambiguous auth state
    setApiKey(apiKeyInput.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6EF] dark:bg-instrument-bg px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="w-14 h-14 bg-healthcare-500 rounded-xl flex items-center justify-center shadow-lg shadow-healthcare-500/30">
          <PillIcon className="w-10 h-5" rotate />
        </div>
        <div className="text-center">
          <h1 className="font-semibold font-display text-3xl text-slate-800 dark:text-instrument-text leading-none flex items-center gap-1 justify-center">
            DocDefend<span className="text-red-500 text-sm">&#10010;</span>
          </h1>
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">Clinical Documentation QA</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-2xl border border-[#D6C9A8] dark:border-instrument-border p-6 sm:p-7 shadow-card">
        {showApiKeyMode ? (
          /* API Key Mode */
          <>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">Use API Key</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Enter your Anthropic API key to use the app with your own credits.
            </p>

            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Anthropic API Key
            </label>
            <div className="relative mb-4">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                aria-label="Anthropic API key"
                className="w-full px-3 py-2.5 pr-10 text-sm bg-[#FAF6EF] dark:bg-instrument-bg border-2 border-[#D6C9A8] dark:border-instrument-border rounded-xl focus:ring-2 focus:ring-healthcare-500 focus:border-transparent outline-none text-slate-800 dark:text-white placeholder-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && handleApiKeySave()}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showKey ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            <button
              onClick={handleApiKeySave}
              disabled={!apiKeyInput.trim()}
              className="w-full py-2.5 bg-healthcare-500 hover:bg-healthcare-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-healthcare-500/30"
            >
              Continue with API Key
            </button>

            <div className="text-center mt-4 pt-4 border-t border-[#D6C9A8] dark:border-instrument-border">
              <button
                type="button"
                onClick={() => setShowApiKeyMode(false)}
                className="text-sm text-healthcare-500 dark:text-trace font-medium hover:underline"
              >
                &larr; Back to sign in
              </button>
            </div>
          </>
        ) : (
          /* Sign In Form */
          <>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">Sign in</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Enter your team credentials</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <label htmlFor="login-username" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoFocus
                autoComplete="username"
                disabled={sending}
                className="w-full px-3 py-2.5 text-sm bg-[#FAF6EF] dark:bg-instrument-bg border-2 border-[#D6C9A8] dark:border-instrument-border rounded-xl focus:ring-2 focus:ring-healthcare-500 focus:border-transparent outline-none text-slate-800 dark:text-white placeholder-slate-400 mb-4 disabled:opacity-50"
              />

              <label htmlFor="login-password" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter team password"
                required
                autoComplete="current-password"
                disabled={sending}
                className="w-full px-3 py-2.5 text-sm bg-[#FAF6EF] dark:bg-instrument-bg border-2 border-[#D6C9A8] dark:border-instrument-border rounded-xl focus:ring-2 focus:ring-healthcare-500 focus:border-transparent outline-none text-slate-800 dark:text-white placeholder-slate-400 mb-4 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={sending || !username.trim() || !password.trim()}
                className="w-full py-2.5 bg-healthcare-500 hover:bg-healthcare-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-healthcare-500/30 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-rotatePill">
                      <PillIcon className="w-6 h-3" />
                    </div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              {slowLogin && (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-3 animate-pulse">
                  Server is waking up — this can take up to 60 seconds on first visit...
                </p>
              )}
            </form>

            <div className="text-center mt-4 pt-4 border-t border-[#D6C9A8] dark:border-instrument-border">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Or continue with your own API key</p>
              <button
                type="button"
                onClick={() => setShowApiKeyMode(true)}
                className="text-sm text-healthcare-500 dark:text-trace font-medium hover:underline"
              >
                Use Anthropic API Key &rarr;
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">Demo only &bull; Not for clinical use</p>
    </div>
  );
}
