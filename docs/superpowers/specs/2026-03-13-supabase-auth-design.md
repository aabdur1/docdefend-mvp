# Supabase Authentication — Design Spec

## Goal

Protect the server's Anthropic API credits by adding authentication via Supabase magic links, while preserving a bring-your-own-API-key path for unauthenticated users.

## Context

DocDefend+ is a stateless MVP with no database, no user accounts, and no auth. Anyone who visits the site can use the server's Anthropic API key (if configured) or enter their own. The server's credits are unprotected. Adding auth gates the server key behind invite-only Supabase accounts, while keeping the app accessible to anyone with their own Anthropic key.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth provider | Supabase Auth (magic links) | No passwords to manage, first-class Supabase feature, free tier sufficient |
| Access model | Invite-only | Full control over who uses server credits; invite from Supabase dashboard |
| API key fallback | Preserved | Non-invited users can still use the app with their own Anthropic key |
| Database scope | Auth only | No history migration; `approved_emails` handled by Supabase invite system |
| JWT validation | Server-side via Supabase admin client | Express middleware verifies JWT, decides which Anthropic key to use |
| Client-side routing | No router — inline URL check in AuthContext | App has no `react-router-dom`; adding one for a single callback route is overkill. `AuthContext` checks `window.location` on mount and handles the callback inline. |
| Auth header injection | Centralized `getAuthHeaders()` replacement | Update existing `getAuthHeaders()` in `ApiKeyContext.jsx` to accept session from `AuthContext` and emit the correct header (JWT or x-api-key) — all call sites already use this function |

## Architecture

```
Browser                         Express (Render)              Supabase
┌─────────────────────┐        ┌──────────────────┐          ┌─────────────────┐
│ React SPA            │        │ server/index.js  │          │ Auth (magic link)│
│                      │ JWT or │                  │  verify  │                 │
│ @supabase/supabase-js│─header─►│ auth middleware   │─────────►│ auth.users      │
│                      │        │                  │          │                 │
│ AuthContext.jsx       │        │ getAnthropicKey()│          └─────────────────┘
└──────────────────────┘        │  JWT → server key │
                                │  x-api-key → theirs│
                                │  neither → 401    │
                                └──────────────────┘
```

### Two Access Paths

**Path A — Whitelisted email (magic link):**
1. User enters email on login page
2. Supabase sends magic link (only works for invited emails — signup is disabled, invite-only)
3. User clicks link → browser navigates to `/auth/callback` with token fragments
4. `AuthContext` detects the `/auth/callback` path on mount via `window.location.pathname`, shows spinning pill, and calls `supabase.auth.exchangeCodeForSession()` to complete the flow
5. On success, `AuthContext` clears the URL to `/` via `history.replaceState()` and sets the user/session state
6. All API requests include `Authorization: Bearer <jwt>` via updated `getAuthHeaders()`
7. Server middleware verifies JWT → uses server's `ANTHROPIC_API_KEY`

**Path B — Own API key:**
1. User clicks "Use Anthropic API Key" on login page
2. Enters their Anthropic API key (existing flow, stored in localStorage)
3. All API requests include `x-api-key` header
4. Server middleware sees no JWT, uses the provided API key

### Server Middleware Logic

```
if Authorization header has valid JWT:
  → set req.anthropicKey = process.env.ANTHROPIC_API_KEY
else if x-api-key header present:
  → set req.anthropicKey = req.headers['x-api-key']
else:
  → return 401 Unauthorized
```

`getAnthropicClient(req)` reads `req.anthropicKey` (set by middleware) instead of inspecting headers directly.

**Public routes (no auth required):**
- `GET /api/health` — health check indicator on login page
- `GET /api/templates` and `GET /api/templates/:id` — template browsing doesn't use AI credits

## New Files

| File | Purpose |
|------|---------|
| `client/src/context/AuthContext.jsx` | Supabase client initialization, auth state management (session, user, loading), `signInWithMagicLink()`, `signOut()`, session rehydration on mount, `/auth/callback` detection via `window.location.pathname` (no router needed), subscribes to `onAuthStateChange` for `TOKEN_REFRESHED` and `SIGNED_OUT` events |
| `client/src/components/LoginPage.jsx` | Login UI — email input for magic link, "check your email" confirmation, "Use Anthropic API Key" fallback link, spinning pill loader, light/dark mode support |
| `server/middleware/auth.js` | Express middleware — checks `Authorization` header (JWT verify via Supabase admin client), falls back to `x-api-key`, returns 401 if neither |
| `server/supabase.js` | Server-side Supabase admin client (initialized with service role key) |

## Modified Files

| File | Change |
|------|--------|
| `client/src/App.jsx` | Wrap in `AuthProvider`, gate main UI behind auth check — show `LoginPage` if not authenticated and no API key |
| `client/src/context/ApiKeyContext.jsx` | Update `getAuthHeaders()` to accept an optional Supabase session; if session exists, return `{ 'Authorization': 'Bearer <jwt>', 'Content-Type': 'application/json' }` instead of `x-api-key` header. All existing call sites (`App.jsx`, `BatchAnalysis.jsx`, `CodeSuggestions.jsx`, `AddendumGenerator.jsx`) already use this function, so they get JWT support for free. |
| `client/src/components/Header.jsx` | Show user email + Sign Out button for authenticated users; conditionally render `ApiKeyInput` only for API-key users (not for JWT-authenticated users) |
| `server/index.js` | Import and apply auth middleware to AI-powered `/api/*` routes (analyze, suggest-codes, generate-addendum, analyze-batch, upload); update `getAnthropicClient(req)` to read `req.anthropicKey` set by middleware instead of inspecting headers directly. Auth middleware applied **after** CORS middleware. |
| `client/package.json` | Add `@supabase/supabase-js` |
| `server/package.json` | Add `@supabase/supabase-js` |
| `client/index.html` | Add Supabase project URL to CSP `connect-src` (project-specific URL, manual step) |
| `client/.env.production` | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| `.env.example` | Add all new Supabase env vars as documentation |
| `vercel.json` | Ensure SPA fallback covers `/auth/callback` route |

## Login Page Design

- Centered card layout on parchment background (`#FAF6EF` light / `#0D0E12` dark)
- Logo: green rounded square with red/white pill icon (rotated -45deg), "DocDefend✚" in DM Serif Display with red cross
- Card uses parchment style (`#F5EFE0` / `#111827` dark) with standard border and shadow
- Email input field with uppercase label
- "Send Magic Link" primary button (healthcare-500 green)
- Divider with "Or continue with your own API key" link below
- Loading states: spinning red/white pill animation (`animate-rotatePill`) with status text ("Sending magic link..." / "Verifying session...")
- "Check your email" confirmation with envelope icon after successful send
- Dark mode fully supported via existing theme tokens
- Footer: "Demo only • Not for clinical use"

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Email not invited | Supabase rejects the request (email signup disabled, invite-only mode) → show "This email isn't registered. Contact the admin for access, or use your own API key." |
| Expired magic link | Show "This link has expired. Request a new one." with button back to login |
| JWT expired during session | Supabase JS auto-refreshes via `onAuthStateChange` listener in `AuthContext`; if refresh fails or `SIGNED_OUT` event fires, clear session → redirect to login |
| Network error on auth | Toast error, stay on login page |
| Both JWT and x-api-key sent | JWT takes precedence. On magic link sign-in, any stored API key in localStorage is cleared to avoid ambiguous state. |
| Valid JWT but user deleted in Supabase | Verification fails → 401 |

## Header Behavior by Auth State

| State | Header shows |
|-------|-------------|
| Authenticated (JWT) | User email + Sign Out button. No API key input. |
| API key user | API key input (existing behavior). No user email. |
| Unauthenticated | Login page shown (header not visible) |

## Environment Variables

| Where | Variable | Secret? |
|-------|----------|---------|
| Client (`.env` / `.env.production` / Vercel) | `VITE_SUPABASE_URL` | No (public) |
| Client (`.env` / `.env.production` / Vercel) | `VITE_SUPABASE_ANON_KEY` | No (public, RLS protects data) |
| Server (`.env` / Render) | `SUPABASE_URL` | No |
| Server (`.env` / Render) | `SUPABASE_SERVICE_ROLE_KEY` | **Yes** (server only, never expose to client) |

## Supabase Setup Requirements

1. Create free Supabase project
2. Configure Email auth provider:
   - **Disable "Enable Email Signup"** toggle (Authentication → Providers → Email) — this enforces invite-only. Without this, any email can request a magic link and get a valid session.
   - Magic link is enabled by default
3. Configure redirect URLs (Authentication → URL Configuration):
   - `https://docdefend.vercel.app/auth/callback` (production)
   - `http://localhost:5173/auth/callback` (local dev)
4. Invite team emails from Supabase dashboard (Authentication → Users → Invite)
5. Set environment variables in Render dashboard: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
6. Set environment variables in Vercel dashboard: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## CSP Update

Add Supabase project URL to `connect-src` in the CSP meta tag in `client/index.html`. The Supabase URL is project-specific and must be manually inserted:

```
connect-src 'self' https://docdefend-mvp.onrender.com https://<project-id>.supabase.co
```

The Supabase JS client makes requests to `https://<project-id>.supabase.co/auth/v1/*` — the wildcard subdomain match covers all Supabase API paths.

## Session Persistence

- Supabase JS stores session in localStorage automatically
- On page refresh, `AuthContext` rehydrates from localStorage — no re-login
- Sign out clears Supabase session from localStorage
- API key path continues using existing localStorage mechanism (7-day expiration)

## Testing Plan

1. Invite a test email in Supabase dashboard
2. Open app → see login page → enter invited email → receive magic link
3. Click magic link → spinning pill → lands in app → header shows email + Sign Out
4. Refresh page → still logged in (session persisted)
5. Sign out → back to login page
6. Try non-invited email → see error message
7. Click "Use Anthropic API Key" → enter key → app works without Supabase auth
8. Verify `/api/health` still works without auth (health indicator on login page)
9. Verify `/api/templates` still works without auth (template browsing)
10. Test on mobile viewport (375px) — login card should be responsive
11. Test dark mode on login page
12. Test concurrent auth state: user has saved API key, then signs in via magic link → verify JWT path is used and API key is cleared from localStorage
