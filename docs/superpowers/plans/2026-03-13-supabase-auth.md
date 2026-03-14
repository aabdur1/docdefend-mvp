# Supabase Authentication Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add invite-only Supabase magic link authentication to protect the server's Anthropic API credits, while preserving a bring-your-own-API-key path for unauthenticated users.

**Architecture:** Supabase Auth handles magic link login/session management on the client. Express middleware validates JWTs server-side and decides which Anthropic API key to use (server's key for authenticated users, user-provided key for API-key users). No client-side router — AuthContext detects `/auth/callback` via `window.location`.

**Tech Stack:** Supabase Auth (`@supabase/supabase-js`), React 18, Express.js, Vite

**Spec:** `docs/superpowers/specs/2026-03-13-supabase-auth-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `server/supabase.js` | Server-side Supabase admin client (service role key) |
| `server/middleware/auth.js` | Express middleware: JWT verify → `req.anthropicKey`, or x-api-key fallback, or 401 |
| `client/src/context/AuthContext.jsx` | Supabase client init, auth state, magic link flow, `/auth/callback` handling, `onAuthStateChange` listener |
| `client/src/components/LoginPage.jsx` | Login UI: email input, "check your email", spinning pill loader, API key fallback link |

### Modified Files
| File | Change |
|------|--------|
| `server/package.json` | Add `@supabase/supabase-js` |
| `client/package.json` | Add `@supabase/supabase-js` |
| `server/index.js` | Import auth middleware, apply to AI routes, update `getAnthropicClient()` |
| `client/src/context/ApiKeyContext.jsx` | Update `getAuthHeaders()` to accept session, emit JWT or x-api-key |
| `client/src/App.jsx` | Wrap in `AuthProvider`, gate UI behind auth check |
| `client/src/components/Header.jsx` | Add user email + sign out; conditionally hide `ApiKeyInput` |
| `client/index.html` | Add Supabase URL to CSP `connect-src` |
| `client/.env.production` | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| `.env.example` | Add all Supabase env vars |

---

## Chunk 1: Server-Side Auth Infrastructure

### Task 1: Install Supabase dependency on server

**Files:**
- Modify: `server/package.json`

- [ ] **Step 1: Install `@supabase/supabase-js` in server**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/server && npm install @supabase/supabase-js
```

- [ ] **Step 2: Update `.env.example` with Supabase variables**

Modify `.env.example` at the project root:

```
ANTHROPIC_API_KEY=your-api-key-here
PORT=3001

# Supabase Auth (required for magic link authentication)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Client-side Supabase (set in client/.env and client/.env.production)
# VITE_SUPABASE_URL=https://your-project-id.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 3: Commit**

```bash
git add server/package.json server/package-lock.json .env.example
git commit -m "chore: add @supabase/supabase-js to server, update env example"
```

---

### Task 2: Create server-side Supabase admin client

**Files:**
- Create: `server/supabase.js`

- [ ] **Step 1: Create `server/supabase.js`**

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — JWT auth will not work. API-key-only mode.');
}

// Service role client — bypasses RLS, used only for JWT verification on the server.
// Never expose the service role key to the client.
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
```

- [ ] **Step 2: Verify the module loads without errors**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/server && node -e "import('./supabase.js').then(() => console.log('OK')).catch(e => console.error(e))"
```

Expected: `WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set...` then `OK`

- [ ] **Step 3: Commit**

```bash
git add server/supabase.js
git commit -m "feat: add server-side Supabase admin client"
```

---

### Task 3: Create auth middleware

**Files:**
- Create: `server/middleware/auth.js`

- [ ] **Step 1: Create `server/middleware/` directory and `auth.js`**

```bash
mkdir -p /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/server/middleware
```

Create `server/middleware/auth.js`:

```javascript
import { supabaseAdmin } from '../supabase.js';

/**
 * Express middleware that resolves the Anthropic API key from auth headers.
 *
 * Priority:
 * 1. Authorization: Bearer <jwt> → verify with Supabase → use server ANTHROPIC_API_KEY
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

    if (!supabaseAdmin) {
      return res.status(503).json({
        error: 'Authentication service unavailable',
        message: 'Server is not configured for JWT authentication. Please use an API key.',
      });
    }

    supabaseAdmin.auth.getUser(token)
      .then(({ data, error }) => {
        if (error || !data.user) {
          return res.status(401).json({
            error: 'Invalid or expired session',
            message: 'Your session has expired. Please sign in again.',
          });
        }

        // Authenticated user — use server's Anthropic API key
        if (!process.env.ANTHROPIC_API_KEY) {
          return res.status(503).json({
            error: 'Server API key not configured',
            message: 'The server Anthropic API key is not set. Please contact the administrator.',
          });
        }

        req.anthropicKey = process.env.ANTHROPIC_API_KEY;
        req.userId = data.user.id;
        req.userEmail = data.user.email;
        next();
      })
      .catch(() => {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Could not verify your session. Please sign in again.',
        });
      });

    return; // async — don't fall through
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

- [ ] **Step 2: Verify the module loads without errors**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/server && node -e "import('./middleware/auth.js').then(() => console.log('OK')).catch(e => console.error(e))"
```

Expected: Supabase warning (no env vars set) then `OK`

- [ ] **Step 3: Commit**

```bash
git add server/middleware/auth.js
git commit -m "feat: add auth middleware for JWT and API key validation"
```

---

### Task 4: Wire auth middleware into Express routes

**Files:**
- Modify: `server/index.js:1-155` (imports and middleware), `server/index.js:149-155` (`getAnthropicClient`)

- [ ] **Step 1: Add import for auth middleware**

At the top of `server/index.js`, after line 19 (the `suggestions.js` import), add:

```javascript
import { requireAuth } from './middleware/auth.js';
```

- [ ] **Step 2: Update `getAnthropicClient()` to use `req.anthropicKey`**

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

- [ ] **Step 3: Apply `requireAuth` middleware to AI-powered routes**

After the rate limiter declarations (after line 147: `app.use('/api/', generalLimiter);`), add:

```javascript
// Auth middleware — applied to routes that consume API credits or server resources.
// Public routes (health, templates) do NOT require auth.
app.use('/api/analyze', requireAuth);
app.use('/api/analyze-batch', requireAuth);
app.use('/api/suggest-codes', requireAuth);
app.use('/api/generate-addendum', requireAuth);
app.use('/api/code-review', requireAuth);
app.use('/api/upload', requireAuth);
```

- [ ] **Step 4: Verify the server starts without errors**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/server && node -e "import('./index.js').then(() => console.log('Server loaded OK')).catch(e => console.error(e))"
```

Expected: Supabase warning, then `DocDefend API server running on port 3001`

- [ ] **Step 5: Verify public routes still work without auth**

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/templates
```

Expected: `{"status":"ok"}` and a JSON array of templates.

- [ ] **Step 6: Verify auth-required routes reject unauthenticated requests**

```bash
curl -X POST http://localhost:3001/api/analyze -H "Content-Type: application/json" -d '{"note":"test"}'
```

Expected: `{"error":"Authentication required","message":"Please sign in or provide an Anthropic API key."}`

- [ ] **Step 7: Commit**

```bash
git add server/index.js
git commit -m "feat: wire auth middleware into AI-powered API routes"
```

---

## Chunk 2: Client-Side Auth Infrastructure

### Task 5: Install Supabase dependency on client

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: Install `@supabase/supabase-js` in client**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/client && npm install @supabase/supabase-js
```

- [ ] **Step 2: Create `client/.env` for local dev Supabase config**

Create `client/.env` (gitignored):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 3: Update `client/.env.production`**

Add Supabase variables to `client/.env.production`:

```
VITE_API_URL=https://docdefend-mvp.onrender.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Note: Replace placeholder values with actual Supabase project values before deploying.

- [ ] **Step 4: Commit**

```bash
git add client/package.json client/package-lock.json client/.env.production
git commit -m "chore: add @supabase/supabase-js to client, add Supabase env vars"
```

---

### Task 6: Create AuthContext

**Files:**
- Create: `client/src/context/AuthContext.jsx`

- [ ] **Step 1: Create `client/src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const AuthContext = createContext();

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase client — null if env vars not set (graceful degradation)
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCallback, setIsCallback] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Handle /auth/callback — magic link redirect with PKCE code exchange
    if (window.location.pathname === '/auth/callback') {
      setIsCallback(true);

      // Extract the auth code from the URL query params (PKCE flow)
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      const handleCallback = async () => {
        if (code) {
          // Exchange the auth code for a session (required for PKCE magic links)
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session) {
            setSession(data.session);
            setUser(data.session.user);
            // Clear any stored API key to avoid ambiguous state
            localStorage.removeItem('anthropic_api_key');
            localStorage.removeItem('anthropic_api_key_ts');
          }
        } else {
          // Fallback: try getSession() for implicit flow or hash-based tokens
          const { data: { session: s } } = await supabase.auth.getSession();
          if (s) {
            setSession(s);
            setUser(s.user);
            localStorage.removeItem('anthropic_api_key');
            localStorage.removeItem('anthropic_api_key_ts');
          }
        }
        // Clean up URL
        window.history.replaceState({}, '', '/');
        setIsCallback(false);
        setLoading(false);
      };

      handleCallback();
    } else {
      // Normal mount — check for existing session
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      });
    }

    // Listen for auth state changes (token refresh, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        setSession(s);
        setUser(s?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = useCallback(async (email) => {
    if (!supabase) throw new Error('Authentication is not configured.');

    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isCallback,
      isAuthenticated: !!session,
      supabaseConfigured: !!supabase,
      signInWithMagicLink,
      signOut,
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

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/client && npx vite build 2>&1 | head -20
```

Expected: Build succeeds (may warn about unused vars — that's fine at this stage).

- [ ] **Step 3: Commit**

```bash
git add client/src/context/AuthContext.jsx
git commit -m "feat: add AuthContext with Supabase magic link support"
```

---

### Task 7: Update `getAuthHeaders()` to support JWT

**Files:**
- Modify: `client/src/context/ApiKeyContext.jsx:51-55`

- [ ] **Step 1: Update `getAuthHeaders` to accept an optional session**

Replace the existing `getAuthHeaders` function (lines 51-55) with:

```javascript
export function getAuthHeaders(apiKey, session) {
  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
}
```

This is backwards-compatible: existing callers pass `(apiKey)` and get the same behavior. When a session is passed as the second argument, it emits an `Authorization` header instead.

- [ ] **Step 2: Verify the client builds**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/client && npx vite build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/context/ApiKeyContext.jsx
git commit -m "feat: update getAuthHeaders to support JWT session"
```

---

### Task 8: Update App.jsx to use AuthContext and gate UI

> **Important:** This task imports `LoginPage` which is created in Task 9. Create a stub file first (Step 1), then Task 9 replaces it with the full implementation.

**Files:**
- Modify: `client/src/App.jsx:1-15` (imports), `client/src/App.jsx:213-232` (AppContent state), `client/src/App.jsx:273-275` (fetch headers), `client/src/App.jsx:336-338` (coder fetch headers), `client/src/App.jsx:697-707` (App wrapper)

- [ ] **Step 1: Create LoginPage stub** (replaced with full implementation in Task 9)

Create `client/src/components/LoginPage.jsx`:

```jsx
export default function LoginPage() {
  return <div>Login placeholder</div>;
}
```

- [ ] **Step 2: Add AuthContext import**

At the top of `App.jsx`, after line 13 (`import { ApiKeyProvider, useApiKey, getAuthHeaders } from './context/ApiKeyContext';`), add:

```javascript
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
```

- [ ] **Step 3: Add auth state to AppContent**

Inside `AppContent`, after line 232 (`const { apiKey } = useApiKey();`), add:

```javascript
const { session, user, loading: authLoading, isCallback, isAuthenticated } = useAuth();
```

- [ ] **Step 4: Update fetch calls to pass session**

In `handleAnalyze` (line 275), change:
```javascript
headers: getAuthHeaders(apiKey),
```
to:
```javascript
headers: getAuthHeaders(apiKey, session),
```

In `handleCoderAnalyze` (line 338), change:
```javascript
headers: getAuthHeaders(apiKey),
```
to:
```javascript
headers: getAuthHeaders(apiKey, session),
```

- [ ] **Step 5: Add auth gate and loading state at the top of AppContent's return**

Replace the opening of the return statement (line 398) with a gate that shows LoginPage or a loading state:

```jsx
  // Show spinning pill while auth is initializing or handling callback
  if (authLoading || isCallback) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6EF] dark:bg-instrument-bg">
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-healthcare-500/20 blur-xl animate-pulse"></div>
          </div>
          <div className="relative animate-rotatePill drop-shadow-xl">
            <PillIcon className="w-20 h-10" />
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isCallback ? 'Verifying session...' : 'Loading...'}
        </p>
      </div>
    );
  }

  // Show login page if not authenticated and no API key
  if (!isAuthenticated && !apiKey) {
    return <LoginPage />;
  }

  return (
```

Keep the rest of the return (the main app UI) as is. The closing remains the same.

- [ ] **Step 6: Wrap App in AuthProvider**

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

- [ ] **Step 7: Verify the client builds**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/client && npx vite build 2>&1 | tail -5
```

Expected: Build succeeds (the stub LoginPage from Step 1 satisfies the import).

- [ ] **Step 8: Commit**

```bash
git add client/src/components/LoginPage.jsx client/src/App.jsx
git commit -m "feat: gate app behind auth, integrate AuthContext"
```

---

## Chunk 3: Login Page & Header Updates

### Task 9: Implement full LoginPage component

**Files:**
- Replace: `client/src/components/LoginPage.jsx` (replaces the stub from Task 8)

- [ ] **Step 1: Replace the LoginPage stub with the full implementation**

```jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiKey } from '../context/ApiKeyContext';
import PillIcon from './PillIcon';

export default function LoginPage() {
  const { signInWithMagicLink, supabaseConfigured } = useAuth();
  const { setApiKey } = useApiKey();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [showApiKeyMode, setShowApiKeyMode] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setError(null);

    try {
      await signInWithMagicLink(email.trim());
      setSent(true);
    } catch (err) {
      if (err.message?.includes('Signups not allowed')) {
        setError("This email isn't registered. Contact the admin for access, or use your own API key.");
      } else {
        setError(err.message || 'Failed to send magic link. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleApiKeySave = () => {
    if (!apiKeyInput.trim()) return;
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
        ) : sent ? (
          /* Check Email State */
          <>
            <div className="text-center">
              <svg className="w-12 h-12 text-healthcare-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-lg font-semibold font-display text-slate-800 dark:text-white mb-2">Check your email</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We sent a login link to<br />
                <strong className="text-slate-700 dark:text-slate-200">{email}</strong>
              </p>
              <button
                type="button"
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-4 text-sm text-healthcare-500 dark:text-trace font-medium hover:underline"
              >
                Use a different email
              </button>
            </div>
          </>
        ) : (
          /* Sign In Form */
          <>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">Sign in</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Enter your email to receive a magic link</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSendMagicLink}>
              <label htmlFor="login-email" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@practice.com"
                required
                autoFocus
                disabled={sending}
                className="w-full px-3 py-2.5 text-sm bg-[#FAF6EF] dark:bg-instrument-bg border-2 border-[#D6C9A8] dark:border-instrument-border rounded-xl focus:ring-2 focus:ring-healthcare-500 focus:border-transparent outline-none text-slate-800 dark:text-white placeholder-slate-400 mb-4 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="w-full py-2.5 bg-healthcare-500 hover:bg-healthcare-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-healthcare-500/30 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-rotatePill">
                      <PillIcon className="w-6 h-3" />
                    </div>
                    Sending...
                  </>
                ) : (
                  'Send Magic Link'
                )}
              </button>
            </form>

            {!supabaseConfigured && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 text-center">
                Email login is not configured. Use an API key instead.
              </p>
            )}

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

- [ ] **Step 2: Verify the client builds**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/client && npx vite build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/LoginPage.jsx
git commit -m "feat: add LoginPage with magic link and API key modes"
```

---

### Task 10: Update Header with user email and sign out

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
const { user, isAuthenticated, signOut } = useAuth();
```

- [ ] **Step 3: Replace the ApiKeyInput section with conditional rendering**

Replace line 88-89:
```jsx
            {/* API Key Input */}
            <ApiKeyInput />
```

With:
```jsx
            {/* Auth: user email + sign out for JWT users, API key input for key users */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline text-xs text-slate-600 dark:text-slate-400 truncate max-w-[140px]" title={user?.email}>
                  {user?.email}
                </span>
                <button
                  type="button"
                  onClick={signOut}
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
              </div>
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
git commit -m "feat: show user email and sign out in header for authenticated users"
```

---

## Chunk 4: Configuration & Wiring

### Task 11: Update CSP and verify SPA fallback

**Files:**
- Modify: `client/index.html:5` (CSP meta tag)
- Verify: `vercel.json` (SPA fallback already covers `/auth/callback`)

- [ ] **Step 1: Update CSP `connect-src` in `client/index.html`**

On line 5, update the CSP meta tag. In the `connect-src` directive, add the Supabase project URL. Replace `<project-id>` with the actual Supabase project ID:

```
connect-src 'self' https://docdefend-mvp.onrender.com https://<project-id>.supabase.co
```

The full meta tag line becomes:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://docdefend-mvp.onrender.com https://<project-id>.supabase.co; img-src 'self' data:;" />
```

Note: This is a manual step — the `<project-id>` placeholder must be replaced with the actual value from the Supabase dashboard once the project is created.

- [ ] **Step 2: Verify `vercel.json` SPA fallback**

The existing `vercel.json` already has `{ "source": "/(.*)", "destination": "/index.html" }` which covers `/auth/callback`. No changes needed.

- [ ] **Step 3: Commit**

```bash
git add client/index.html
git commit -m "feat: add Supabase URL to CSP connect-src"
```

---

### Task 12: Update BatchAnalysis and AddendumGenerator fetch calls

**Files:**
- Modify: `client/src/components/BatchAnalysis.jsx` (fetch calls)
- Modify: `client/src/components/AddendumGenerator.jsx` (fetch calls)
- Modify: `client/src/components/CodeSuggestions.jsx` (fetch calls)

These components import `getAuthHeaders` from `ApiKeyContext` and call it with `(apiKey)`. They need to also pass the session so JWT users get the `Authorization` header.

- [ ] **Step 1: Update BatchAnalysis.jsx**

Add import at the top:
```javascript
import { useAuth } from '../context/AuthContext';
```

Inside the component function, add:
```javascript
const { session } = useAuth();
```

Find every call to `getAuthHeaders(apiKey)` in this file and change to `getAuthHeaders(apiKey, session)`.

- [ ] **Step 2: Update CodeSuggestions.jsx**

Add import at the top:
```javascript
import { useAuth } from '../context/AuthContext';
```

Inside the component function, add:
```javascript
const { session } = useAuth();
```

Change `getAuthHeaders(apiKey)` to `getAuthHeaders(apiKey, session)`.

- [ ] **Step 3: Update AddendumGenerator.jsx**

Add import at the top:
```javascript
import { useAuth } from '../context/AuthContext';
```

Inside the component function, add:
```javascript
const { session } = useAuth();
```

Change `getAuthHeaders(apiKey)` to `getAuthHeaders(apiKey, session)`.

- [ ] **Step 4: Verify the client builds**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/client && npx vite build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/BatchAnalysis.jsx client/src/components/CodeSuggestions.jsx client/src/components/AddendumGenerator.jsx
git commit -m "feat: pass auth session to getAuthHeaders in all API call sites"
```

---

### Task 13: Supabase project setup (manual)

This task is done manually in the Supabase dashboard and deployment platforms. No code changes.

- [ ] **Step 1: Create a Supabase project**

Go to https://supabase.com → New Project. Note the project URL and keys from Settings → API.

- [ ] **Step 2: Disable email signup (enforce invite-only)**

In Supabase dashboard: Authentication → Providers → Email → **Disable "Enable Email Signup"** toggle. This ensures only invited emails can authenticate. Magic link toggle should remain on.

- [ ] **Step 3: Configure redirect URLs**

In Supabase dashboard: Authentication → URL Configuration → Add redirect URLs:
- `https://docdefend.vercel.app/auth/callback`
- `http://localhost:5173/auth/callback`

- [ ] **Step 4: Set local environment variables**

Create/update `server/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Create/update `client/.env`:
```
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Update `client/.env.production` with the same Supabase values.

- [ ] **Step 5: Update CSP with actual Supabase project ID**

Replace `<project-id>` in `client/index.html` CSP with the actual Supabase project ID.

- [ ] **Step 6: Invite test emails**

In Supabase dashboard: Authentication → Users → Invite User. Invite your team emails.

- [ ] **Step 7: Set Render environment variables**

In Render dashboard: add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 8: Set Vercel environment variables**

In Vercel dashboard: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

### Task 14: End-to-end manual testing

- [ ] **Step 1: Start local servers**

```bash
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/server && npm start
# In another terminal:
cd /Users/amirabdurrahim/Documents/MSMIS/IDS594/mvp/docdefend-mvp/client && npm run dev
```

- [ ] **Step 2: Test unauthenticated state**

Open `http://localhost:5173`. Verify:
- Login page is shown (not the main app)
- Logo, fonts, colors match the existing design
- Health check indicator works on login page background
- Dark mode toggle from previous session is respected

- [ ] **Step 3: Test magic link flow**

Enter an invited email → click "Send Magic Link" → verify spinning pill animation → check email → click magic link → verify spinning pill "Verifying session..." → app loads → header shows email + Sign Out.

- [ ] **Step 4: Test session persistence**

Refresh the page. Verify the user stays logged in (no login page shown).

- [ ] **Step 5: Test sign out**

Click Sign Out in header. Verify redirect to login page.

- [ ] **Step 6: Test non-invited email**

Enter a non-invited email → submit. Verify error message: "This email isn't registered..."

- [ ] **Step 7: Test API key path**

Click "Use Anthropic API Key" → enter a valid key → click "Continue with API Key" → verify app loads and works as before (header shows API key indicator).

- [ ] **Step 8: Test public routes without auth**

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/templates
```

Verify both return valid JSON without auth headers.

- [ ] **Step 9: Test protected routes without auth**

```bash
curl -X POST http://localhost:3001/api/analyze -H "Content-Type: application/json" -d '{"note":"test"}'
```

Verify 401 response.

- [ ] **Step 10: Test mobile viewport**

Open DevTools → mobile view (375px). Verify login card is responsive and usable.

- [ ] **Step 11: Test dark mode on login page**

Toggle dark mode (from previous session preference). Verify parchment → instrument theme switch.

- [ ] **Step 12: Final commit** (if any configuration files were updated)

```bash
git add client/index.html client/.env.production
git commit -m "feat: configure Supabase project URLs for auth integration"
```
