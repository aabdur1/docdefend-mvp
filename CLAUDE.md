# DocDefend+ — Clinical Documentation QA Platform

## What This Is

DocDefend+ is a full-stack web application that acts as a **pre-claim QA layer** for small medical practices. A provider or billing coder pastes (or uploads) a clinical note, selects the CPT and ICD-10 codes they plan to bill, and the app uses Claude AI to analyze whether the documentation defensibly supports those codes. It outputs a professional report with gap analysis, fix suggestions, E/M level recommendations, and financial impact estimates. Currently supports **pain management** and **family medicine** specialties.

This is a **demo/MVP** built for IDS 594. It uses synthetic patient notes and the Anthropic Claude API. The goal is to demonstrate the concept to professors, investors, and potential customers. **Never use real patient data.**

## Development Commands

```bash
# Install (from docdefend-mvp/)
npm install && cd client && npm install && cd ../server && npm install

# Backend (terminal 1)
cd server && npm start       # Express on :3001
cd server && npm run dev     # Watch mode

# Frontend (terminal 2)
cd client && npm run dev     # Vite on :5173, proxies /api → :3001

# Production build
cd client && npm run build   # Output: client/dist
```

## Live Deployment

- **Frontend**: Deployed on **Vercel** (static SPA from `client/dist`) — https://docdefend.vercel.app
- **Backend**: Deployed on **Render** (Express server from `server/`) — https://docdefend-mvp.onrender.com

The frontend reads `VITE_API_URL` (baked in at build time) to know where to send API requests. In local dev, it's empty and Vite proxies `/api` to Express on :3001.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 (Vite), Tailwind CSS 3 |
| Backend (prod) | Express.js on Render (free tier) |
| Backend (local dev) | Express.js on port 3001 |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Document parsing | `pdf-parse`, `fast-xml-parser` |
| File uploads | `multer` (Express) |
| Rate limiting | `express-rate-limit` (10 AI req/min, 60 general req/min per IP) |
| Auth | JWT-based login (`middleware/auth.js`) |
| Database | None — stateless API, localStorage for UI history |

## Project Structure

```
docdefend-mvp/
├── client/                           # React frontend (deployed on Vercel)
│   ├── src/
│   │   ├── App.jsx                   # Root component — layout, state, API calls, ErrorBoundary
│   │   ├── components/
│   │   │   ├── Header.jsx            # Nav bar, health check indicator, dark mode toggle, batch toggle
│   │   │   ├── NoteSelector.jsx      # Sliding-tab input (Sample/Upload/Paste)
│   │   │   ├── CodeSelector.jsx      # CPT/ICD-10 checkbox lists
│   │   │   ├── CodeSuggestions.jsx   # AI code recommendations
│   │   │   ├── PayerSelector.jsx     # Payer grid (Medicare/UHC/Aetna/BCBS/Cigna)
│   │   │   ├── AnalysisReport.jsx    # Full defensibility report
│   │   │   ├── DowncodeWarning.jsx   # Payer downcoding risk alert with prevention tips
│   │   │   ├── ScoreRing.jsx         # Animated SVG circular progress ring
│   │   │   ├── EMLevelCard.jsx       # E/M level recommendation (MDM breakdown)
│   │   │   ├── FinancialImpact.jsx   # Revenue impact with dollar counters
│   │   │   ├── AddendumGenerator.jsx # Generate addendum text to close gaps
│   │   │   ├── BatchAnalysis.jsx     # Multi-note batch processing UI
│   │   │   ├── TemplateLibrary.jsx   # Modal: browse/preview/use clinical templates
│   │   │   ├── Dashboard.jsx         # History panel with charts
│   │   │   ├── FileUploader.jsx      # Drag-drop file upload (PDF, CCDA, TXT)
│   │   │   ├── LoginPage.jsx         # Password login + API key mode
│   │   │   ├── PillIcon.jsx          # Shared SVG pill icon (useId for unique gradient IDs)
│   │   │   ├── ApiKeyInput.jsx       # Direct API key entry (fallback auth)
│   │   │   ├── RiskBadge.jsx         # Risk level badge indicator
│   │   │   ├── Toast.jsx             # Toast notifications with countdown
│   │   │   └── EKGLine.jsx           # Animated EKG heartbeat line
│   │   ├── utils/generatePdfReport.js
│   │   ├── context/
│   │   │   ├── ApiKeyContext.jsx     # API key management (7-day expiration)
│   │   │   └── AuthContext.jsx       # JWT auth state
│   │   └── data/
│   │       ├── sampleNotes.json      # 10 synthetic notes (6 pain mgmt + 4 FM)
│   │       └── reimbursementRates.js # Medicare rate lookup
│   ├── STYLE_GUIDE.md                # Full design system (colors, typography, CSS patterns, animations, responsive)
│   └── index.html                    # Google Fonts, favicon, dark mode script, CSP
│
├── server/
│   ├── index.js                      # All API endpoints
│   ├── prompt.js                     # System prompt for Claude analysis
│   ├── payerRules.js                 # Payer documentation rules (Medicare, UHC, Aetna, BCBS, Cigna)
│   ├── downcodeRules.js              # Payer E/M downcoding detection engine
│   ├── rulesLoader.js                # Dynamic JSON rules loader with staleness warnings
│   ├── parsers.js                    # CCDA/PDF/text extraction
│   ├── suggestions.js                # Template library + suggestion/addendum prompts
│   ├── middleware/auth.js            # JWT verification middleware
│   ├── data/
│   │   ├── downcode-policies.json    # Payer downcoding policies (updated by n8n)
│   │   └── cms-peer-benchmarks.json  # CMS E/M utilization benchmarks by specialty
│   └── package.json
│
├── n8n/
│   └── payer-policy-workflow.json    # Weekly payer policy monitor workflow
│
├── docs/superpowers/plans/           # Implementation plans (generated by Claude Code)
├── sample-files/                     # Sample clinical documents for testing upload
├── HIPAA_COMPLIANCE.md               # HIPAA strategy + validation pilot plan
├── render.yaml                       # Render Blueprint
├── vercel.json                       # Vercel config
└── .env.example
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/analyze` | Main defensibility analysis (includes downcoding risk check) |
| `POST` | `/api/analyze-batch` | Batch analysis (up to 20 notes) |
| `POST` | `/api/suggest-codes` | AI code suggestions with confidence |
| `POST` | `/api/generate-addendum` | Generate compliant addendum text |
| `POST` | `/api/code-review` | Billing coder workflow: suggest highest defensible codes |
| `POST` | `/api/upload` | Parse uploaded document (PDF/XML/TXT) |
| `GET` | `/api/templates` | List all clinical templates |
| `GET` | `/api/templates/:id` | Get single template by ID |
| `POST` | `/api/downcode-check` | Standalone payer downcoding risk check (no AI, instant) |
| `GET` | `/api/downcode-policies` | List known payer downcoding policies |
| `POST` | `/api/admin/reload-rules` | Reload JSON rules from data files (admin auth in prod) |
| `POST` | `/api/login` | Validate credentials, return JWT |
| `GET` | `/api/health` | Health check (includes rules staleness status) |

All AI-consuming endpoints require JWT auth (via `requireAuth` middleware) or fall back to `x-api-key` header.

## Environment Variables

### Render (server)
```
ANTHROPIC_API_KEY=sk-ant-...    # Required for Claude API calls
CORS_ORIGIN=https://docdefend.vercel.app  # Allowed frontend origin
NODE_ENV=production
JWT_SECRET=...                   # For signing auth tokens
AUTH_USERNAME=...                # Login credentials
AUTH_PASSWORD=...                # Login credentials
ADMIN_API_KEY=...                # For /api/admin/reload-rules in production
```

### Vercel (client build)
```
VITE_API_URL=https://docdefend-mvp.onrender.com  # Set in client/.env.production
```

### Local dev
```
ANTHROPIC_API_KEY=sk-ant-...    # In server/.env
PORT=3001                        # Express server port
JWT_SECRET=dev-secret            # Any value for local dev
AUTH_USERNAME=...                # Local login credentials
AUTH_PASSWORD=...                # Local login credentials
# No VITE_API_URL needed — Vite proxies /api to localhost:3001
# No ADMIN_API_KEY needed — reload endpoint is open in dev
```

## Claude Integration

- **Model**: `claude-sonnet-4-20250514`
- **System prompt**: CDI specialist persona with 15 years of experience, enforces CMS 2021+ MDM guidelines, returns structured JSON. Includes prompt injection guard.
- **Max tokens**: 4096 (analysis), 2048 (suggestions/addendums)
- **Timeout**: 55 seconds per API call, passed as SDK request option (`messages.create({...}, { timeout })` — NOT inside body params)
- **Response parsing**: `parseClaudeJSON()` strips markdown fences and parses JSON. Never leaks raw Claude output to client.
- **Batch concurrency**: 3 notes processed in parallel
- **Extended response fields**: `emLevelRecommendation`, `financialImpact`, `downcodeRisk`

## Key Conventions

- `PillIcon.jsx` — shared SVG pill component with `useId()` for unique gradient IDs
- PDF export uses `utils/generatePdfReport.js` — generates formatted HTML in a Blob URL, not `window.print()` screenshots
- Dashboard and TemplateLibrary are lazy-loaded via `React.lazy()` + `Suspense`
- CSP meta tag in `index.html` — allows self, Google Fonts, and the Render backend
- Focus rings on buttons use `focus-visible:ring` (keyboard only), input fields use `focus:ring`
- Downcoding detection is deterministic (no AI call). Rules load from `server/data/*.json` with hardcoded fallback
- `safeErrorMessage()` sanitizes all server errors — never exposes SDK internals
- Input validation: code arrays must be non-empty strings, request bodies capped at 1MB
- CORS defaults to `https://docdefend.vercel.app` + `docdefend.health` in prod, `*` in dev

## Design System

"Parchment + Precision Instrument" — warm paper tones in light mode, deep navy instrument display in dark mode. **Full reference in `client/STYLE_GUIDE.md`** (colors, typography, CSS patterns, animations, responsive breakpoints).

Quick reference:
- `font-display` (DM Serif Display) for card titles only
- `font-body` (DM Sans) for UI text
- `font-mono` (Share Tech Mono) for codes/amounts
- `font-clinical` (IBM Plex Mono) for clinical note textarea
- Payer brand colors: blue (Medicare), orange (UHC), purple (Aetna), sky (BCBS), teal (Cigna)

## Important Notes

- **DEMO ONLY** — uses synthetic patient notes. Never use real PHI.
- **Sample notes have intentional gaps** — by design for demonstration.
- **No HIPAA compliance yet** — see `HIPAA_COMPLIANCE.md` for production strategy and validation pilot plan.
- **Render free tier** sleeps after 15 min of inactivity (~30-60s cold start).
- **File upload limit** — 10MB max (server-side via multer + client-side pre-check).
- **Batch limit** — 20 notes per request, processed 3 at a time concurrently.
- **Time-based E/M billing not supported yet** — analysis assumes MDM-based billing. Time-based path (legitimate under CMS, especially for new patients) is a planned addition (flagged by Dr. Caruso 2026-04-16).
