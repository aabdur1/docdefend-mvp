# Simple Password Authentication Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protect the server's Anthropic API credits with a shared team password, while preserving the bring-your-own-API-key path for external users.

**Architecture:** Server validates username/password against env vars and issues a JWT. Express middleware checks for JWT (→ server API key) or x-api-key header (→ user's key), returning 401 if neither. Client stores JWT in localStorage and shows a login page when unauthenticated.

**Tech Stack:** Express.js, `jsonwebtoken`, React 18 (existing)

**Spec:** This replaces the Supabase auth plan (`docs/superpowers/plans/2026-03-13-supabase-auth.md`) with a simpler shared-password approach. Same two-path architecture, no external dependencies.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `server/middleware/auth.js` | Express middleware: JWT verify → `req.anthropicKey`, or x-api-key fallback, or 401 |
| `client/src/context/AuthContext.jsx` | Auth state (JWT in localStorage), login/logout functions, token to all consumers |
| `client/src/components/LoginPage.jsx` | Login UI: username + password fields, API key fallback link, spinning pill loader |

### Modified Files
| File | Change |
|------|--------|
| `server/package.json` | Add `jsonwebtoken` |
| `server/index.js` | Add `/api/login` endpoint, import + wire auth middleware, update `getAnthropicClient()` |
| `.env.example` | Add `AUTH_USERNAME`, `AUTH_PASSWORD`, `JWT_SECRET` |
| `client/src/context/ApiKeyContext.jsx` | Update `getAuthHeaders()` to accept auth token |
| `client/src/App.jsx` | Wrap in `AuthProvider`, gate UI behind auth check, show `LoginPage` |
| `client/src/components/Header.jsx` | Show "Sign Out" button for authenticated users, conditionally hide `ApiKeyInput` |
| `client/src/components/BatchAnalysis.jsx` | Pass auth token to `getAuthHeaders()` and file upload headers |
| `client/src/components/CodeSuggestions.jsx` | Pass auth token to `getAuthHeaders()` |
| `client/src/components/AddendumGenerator.jsx` | Pass auth token to `getAuthHeaders()` |
| `client/src/components/FileUploader.jsx` | Add auth token to file upload headers |

---

## Chunk 1: Server-Side Auth

### Task 1: Install jsonwebtoken and update env example

**Files:**
- Modify: `server/package.json`
- Modify: `.env.example`

- [ ] **Step 1: Install `jsonwebtoken` in server**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/server && npm install jsonwebtoken
```

- [ ] **Step 2: Update `.env.example` with auth variables**

Replace the full contents of `.env.example`:

```
ANTHROPIC_API_KEY=your-api-key-here
PORT=3001

# Simple auth (shared team credentials)
AUTH_USERNAME=docdefend
AUTH_PASSWORD=your-shared-password-here
JWT_SECRET=your-random-secret-here
```

- [ ] **Step 3: Add auth variables to local `server/.env`**

Add these three lines to the existing `server/.env` (do NOT overwrite existing values):

```
AUTH_USERNAME=docdefend
AUTH_PASSWORD=<pick a team password>
JWT_SECRET=<any random string, e.g. output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

- [ ] **Step 4: Commit**

```bash
git add server/package.json server/package-lock.json .env.example
git commit -m "chore: add jsonwebtoken dependency, update env example with auth vars"
```

---

### Task 2: Create auth middleware

**Files:**
- Create: `server/middleware/auth.js`

- [ ] **Step 1: Create `server/middleware/` directory**

```bash
mkdir -p /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/server/middleware
```

- [ ] **Step 2: Create `server/middleware/auth.js`**

```javascript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set — JWT auth will not work. API-key-only mode.');
}

/**
 * Express middleware that resolves the Anthropic API key from auth headers.
 *
 * Priority:
 * 1. Authorization: Bearer <jwt> → verify → use server ANTHROPIC_API_KEY
 * 2. x-api-key header → use that key directly (bring-your-own-key)
 * 3. Neither → 401
 *
 * Sets req.anthropicKey for downstream use by getAnthropicClient().
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  // Path 1: JWT authentication
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    if (!JWT_SECRET) {
      return res.status(503).json({
        error: 'Authentication service unavailable',
        message: 'Server is not configured for password authentication. Please use an API key.',
      });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({
        error: 'Invalid or expired session',
        message: 'Your session has expired. Please sign in again.',
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        error: 'Server API key not configured',
        message: 'The server Anthropic API key is not set. Please contact the administrator.',
      });
    }

    req.anthropicKey = process.env.ANTHROPIC_API_KEY;
    return next();
  }

  // Path 2: Bring-your-own API key
  if (apiKey) {
    req.anthropicKey = apiKey;
    return next();
  }

  // Path 3: No auth
  return res.status(401).json({
    error: 'Authentication required',
    message: 'Please sign in or provide an Anthropic API key.',
  });
}
```

- [ ] **Step 3: Verify the module loads without errors**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/server && node -e "import('./middleware/auth.js').then(() => console.log('OK')).catch(e => console.error(e))"
```

Expected: `WARNING: JWT_SECRET not set...` then `OK`

- [ ] **Step 4: Commit**

```bash
git add server/middleware/auth.js
git commit -m "feat: add auth middleware for JWT and API key validation"
```

---

### Task 3: Add login endpoint and wire auth middleware into Express

**Files:**
- Modify: `server/index.js:1-6` (imports), `server/index.js:149-155` (`getAnthropicClient`), `server/index.js:142-147` (after rate limiters)

- [ ] **Step 1: Add imports at the top of `server/index.js`**

After line 6 (`import helmet from 'helmet';`), add:

```javascript
import jwt from 'jsonwebtoken';
import { requireAuth } from './middleware/auth.js';
```

- [ ] **Step 2: Add `/api/login` endpoint**

After the rate limiter block (after line 147: `app.use('/api/', generalLimiter);`), add the auth middleware declarations and login endpoint:

```javascript
// Auth middleware — applied to routes that consume API credits or server resources.
// Public routes (health, templates, login) do NOT require auth.
app.use('/api/analyze', requireAuth);
app.use('/api/analyze-batch', requireAuth);
app.use('/api/suggest-codes', requireAuth);
app.use('/api/generate-addendum', requireAuth);
app.use('/api/code-review', requireAuth);
app.use('/api/upload', requireAuth);

// Login endpoint — validates shared team credentials, returns JWT
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!validUsername || !validPassword || !jwtSecret) {
    return res.status(503).json({
      error: 'Auth not configured',
      message: 'Server authentication is not configured. Please use an API key.',
    });
  }

  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Incorrect username or password.',
    });
  }

  const token = jwt.sign({ sub: 'team' }, jwtSecret, { expiresIn: '7d' });
  res.json({ token });
});
```

- [ ] **Step 3: Update `getAnthropicClient()` to use `req.anthropicKey`**

Replace the existing `getAnthropicClient` function (lines 149-155) with:

```javascript
function getAnthropicClient(req) {
  const apiKey = req.anthropicKey || req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('No API key provided. Please sign in or enter your Anthropic API key.');
  }
  return new Anthropic({ apiKey });
}
```

Note: `req.anthropicKey` is set by the auth middleware. The fallbacks (`x-api-key`, env var) remain for routes that don't use the middleware (public routes).

- [ ] **Step 4: Verify the server starts without errors**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/server && timeout 5 node index.js 2>&1 || true
```

Expected: `DocDefend API server running on port 3001` (will exit after 5s timeout — that's fine).

- [ ] **Step 5: Verify public routes still work without auth**

Start the server in background, then test:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/templates
```

Expected: `{"status":"ok"}` and a JSON array of templates.

- [ ] **Step 6: Verify protected routes reject unauthenticated requests**

```bash
curl -s -X POST http://localhost:3001/api/analyze -H "Content-Type: application/json" -d '{"note":"test"}'
```

Expected: `{"error":"Authentication required","message":"Please sign in or provide an Anthropic API key."}`

- [ ] **Step 7: Verify login endpoint works**

```bash
curl -s -X POST http://localhost:3001/api/login -H "Content-Type: application/json" -d '{"username":"docdefend","password":"<your-password>"}'
```

Expected: `{"token":"eyJ..."}` — a valid JWT.

- [ ] **Step 8: Verify JWT grants access to protected routes**

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/login -H "Content-Type: application/json" -d '{"username":"docdefend","password":"<your-password>"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).token))")
curl -s -X POST http://localhost:3001/api/analyze -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"note":"test"}'
```

Expected: Should get past auth (will fail on validation — "CPT codes required" — which means auth worked).

- [ ] **Step 9: Commit**

```bash
git add server/index.js
git commit -m "feat: add login endpoint and wire auth middleware to protected routes"
```

---

## Chunk 2: Client-Side Auth

### Task 4: Create AuthContext

**Files:**
- Create: `client/src/context/AuthContext.jsx`

- [ ] **Step 1: Create `client/src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext();

const TOKEN_KEY = 'docdefend_auth_token';

function isTokenExpired(tok) {
  try {
    const payload = JSON.parse(atob(tok.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved && isTokenExpired(saved)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return saved;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = !!token;

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(API_URL + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);

      // Clear any stored API key to avoid ambiguous auth state
      localStorage.removeItem('anthropic_api_key');
      localStorage.removeItem('anthropic_api_key_ts');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      token,
      isAuthenticated,
      loading,
      error,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/context/AuthContext.jsx
git commit -m "feat: add AuthContext for simple password auth"
```

---

### Task 5: Update `getAuthHeaders()` to support JWT

**Files:**
- Modify: `client/src/context/ApiKeyContext.jsx:51-55`

- [ ] **Step 1: Update `getAuthHeaders` to accept an optional token**

Replace the existing `getAuthHeaders` function (lines 51-55) with:

```javascript
export function getAuthHeaders(apiKey, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
}
```

This is backwards-compatible: existing callers pass `(apiKey)` and get the same behavior. When a token is passed as the second argument, it emits an `Authorization` header instead.

- [ ] **Step 2: Commit**

```bash
git add client/src/context/ApiKeyContext.jsx
git commit -m "feat: update getAuthHeaders to support JWT token"
```

---

### Task 6: Create LoginPage component

**Files:**
- Create: `client/src/components/LoginPage.jsx`

- [ ] **Step 1: Create `client/src/components/LoginPage.jsx`**

```jsx
import { useState } from 'react';
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
                placeholder="docdefend"
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/LoginPage.jsx
git commit -m "feat: add LoginPage with password login and API key modes"
```

---

### Task 7: Update App.jsx to use AuthContext and gate UI

**Files:**
- Modify: `client/src/App.jsx:1-15` (imports), `client/src/App.jsx:232` (state), `client/src/App.jsx:273-275` (fetch headers), `client/src/App.jsx:336-338` (coder fetch headers), `client/src/App.jsx:397` (return opening), `client/src/App.jsx:697-707` (App wrapper)

- [ ] **Step 1: Add AuthContext import**

At the top of `App.jsx`, after line 13 (`import { ApiKeyProvider, useApiKey, getAuthHeaders } from './context/ApiKeyContext';`), add:

```javascript
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
```

- [ ] **Step 2: Add auth state to AppContent**

Inside `AppContent`, after line 232 (`const { apiKey } = useApiKey();`), add:

```javascript
const { token, isAuthenticated } = useAuth();
```

- [ ] **Step 3: Update fetch calls to pass token**

In `handleAnalyze` (line 275), change:
```javascript
headers: getAuthHeaders(apiKey),
```
to:
```javascript
headers: getAuthHeaders(apiKey, token),
```

In `handleCoderAnalyze` (line 338), change:
```javascript
headers: getAuthHeaders(apiKey),
```
to:
```javascript
headers: getAuthHeaders(apiKey, token),
```

- [ ] **Step 4: Add auth gate at the top of AppContent's return**

Before the opening of the return statement (line 397, `return (`), add this gate:

```jsx
  // Show login page if not authenticated and no API key
  if (!isAuthenticated && !apiKey) {
    return <LoginPage />;
  }
```

Keep the rest of the return (the main app UI) as is.

- [ ] **Step 5: Wrap App in AuthProvider**

Update the `App` default export (lines 697-707) — add `AuthProvider` inside `ErrorBoundary`, wrapping `ApiKeyProvider`:

```jsx
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ApiKeyProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ApiKeyProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 6: Verify the client builds**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/client && npx vite build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: gate app behind auth, integrate AuthContext"
```

---

### Task 8: Update Header with sign out button

**Files:**
- Modify: `client/src/components/Header.jsx:1-4` (imports), `client/src/components/Header.jsx:34-36` (state), `client/src/components/Header.jsx:88-89` (ApiKeyInput)

- [ ] **Step 1: Add auth import to Header**

After line 3 (`import ApiKeyInput from './ApiKeyInput';`), add:

```javascript
import { useAuth } from '../context/AuthContext';
```

- [ ] **Step 2: Add auth state inside Header component**

After line 36 (`const backendStatus = useHealthCheck(30000);`), add:

```javascript
const { isAuthenticated, logout } = useAuth();
```

- [ ] **Step 3: Replace the ApiKeyInput section with conditional rendering**

Replace lines 88-89:
```jsx
            {/* API Key Input */}
            <ApiKeyInput />
```

With:
```jsx
            {/* Auth: sign out for team login, API key input for key users */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                className={`${navBtn} text-xs`}
                aria-label="Sign out"
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign Out</span>
                </span>
              </button>
            ) : (
              <ApiKeyInput />
            )}
```

- [ ] **Step 4: Verify the client builds**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/client && npx vite build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Header.jsx
git commit -m "feat: show sign out button in header for authenticated users"
```

---

### Task 9: Update remaining fetch call sites

**Files:**
- Modify: `client/src/components/BatchAnalysis.jsx`
- Modify: `client/src/components/CodeSuggestions.jsx`
- Modify: `client/src/components/AddendumGenerator.jsx`
- Modify: `client/src/components/FileUploader.jsx`

These components need auth tokens for their API calls. Components using `getAuthHeaders(apiKey)` get the token as a second arg. File upload components that manually construct headers need the `Authorization` header added directly (they use `FormData`, not JSON, so `getAuthHeaders()` is incompatible).

- [ ] **Step 1: Update BatchAnalysis.jsx**

Add import at the top:
```javascript
import { useAuth } from '../context/AuthContext';
```

Inside the component function, add after the existing `useApiKey()` call:
```javascript
const { token } = useAuth();
```

Find every call to `getAuthHeaders(apiKey)` in this file and change to `getAuthHeaders(apiKey, token)`.

Also update the file upload handler (around line 136). Replace:
```javascript
const headers = {};
if (apiKey) headers['x-api-key'] = apiKey;
```
With:
```javascript
const headers = {};
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
} else if (apiKey) {
  headers['x-api-key'] = apiKey;
}
```

- [ ] **Step 2: Update FileUploader.jsx**

Add import at the top:
```javascript
import { useAuth } from '../context/AuthContext';
```

Inside the component function, add after the existing `useApiKey()` call:
```javascript
const { token } = useAuth();
```

Update the file upload handler (around line 55). Replace:
```javascript
const headers = {};
if (apiKey) headers['x-api-key'] = apiKey;
```
With:
```javascript
const headers = {};
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
} else if (apiKey) {
  headers['x-api-key'] = apiKey;
}
```

- [ ] **Step 3: Update CodeSuggestions.jsx**

Add import at the top:
```javascript
import { useAuth } from '../context/AuthContext';
```

Inside the component function, add after the existing `useApiKey()` call:
```javascript
const { token } = useAuth();
```

Change `getAuthHeaders(apiKey)` to `getAuthHeaders(apiKey, token)`.

- [ ] **Step 4: Update AddendumGenerator.jsx**

Add import at the top:
```javascript
import { useAuth } from '../context/AuthContext';
```

Inside the component function, add after the existing `useApiKey()` call:
```javascript
const { token } = useAuth();
```

Change `getAuthHeaders(apiKey)` to `getAuthHeaders(apiKey, token)`.

- [ ] **Step 5: Verify the client builds**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/client && npx vite build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/BatchAnalysis.jsx client/src/components/CodeSuggestions.jsx client/src/components/AddendumGenerator.jsx client/src/components/FileUploader.jsx
git commit -m "feat: pass auth token to all API call sites including file uploads"
```

---

### Task 10: Manual end-to-end testing

- [ ] **Step 1: Start local servers**

```bash
# Terminal 1:
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/server && npm start

# Terminal 2:
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/client && npm run dev
```

- [ ] **Step 2: Test unauthenticated state**

Open `http://localhost:5173`. Verify:
- Login page is shown (not the main app)
- Logo, fonts, colors match the existing design
- Dark mode from previous session is respected

- [ ] **Step 3: Test wrong password**

Enter wrong credentials → click "Sign In" → verify error message "Incorrect username or password."

- [ ] **Step 4: Test successful login**

Enter correct username and password → click "Sign In" → verify spinning pill animation → app loads → header shows "Sign Out" button instead of API key input.

- [ ] **Step 5: Test session persistence**

Refresh the page. Verify the user stays logged in (no login page shown).

- [ ] **Step 6: Test sign out**

Click Sign Out in header. Verify redirect to login page.

- [ ] **Step 7: Test API key path**

Click "Use Anthropic API Key" → enter a valid key → click "Continue with API Key" → verify app loads and works as before (header shows API key input).

- [ ] **Step 8: Test public routes without auth**

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/templates
```

Verify both return valid JSON without auth headers.

- [ ] **Step 9: Test protected routes without auth**

```bash
curl -s -X POST http://localhost:3001/api/analyze -H "Content-Type: application/json" -d '{"note":"test"}'
```

Verify 401 response.

- [ ] **Step 10: Set Render environment variables**

In Render dashboard, add:
- `AUTH_USERNAME` — the shared username
- `AUTH_PASSWORD` — the shared password
- `JWT_SECRET` — a random string (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
