# DocDefend+ — Clinical Documentation QA Platform

**Pre-claim documentation defensibility analysis for small medical practices.**

DocDefend+ is a full-stack web app that helps pain management providers validate whether their clinical documentation supports their planned billing codes *before* claim submission. Paste a clinical note, select CPT and ICD-10 codes, and get an AI-powered defensibility report with gap analysis, fix suggestions, E/M level recommendations, and financial impact estimates.

**Live Demo:** [docdefend-mvp.vercel.app](https://docdefend-mvp.vercel.app)

> **Demo/MVP** built for IDS 594 at Loyola University Chicago. Uses synthetic patient notes and the Anthropic Claude API. **Never use real patient data.**

## Features

- **Defensibility scoring** — Overall HIGH / MEDIUM / LOW rating with per-code breakdown (SUPPORTED / PARTIALLY_SUPPORTED / NOT_SUPPORTED)
- **E/M level recommendations** — MDM-based analysis comparing selected vs. documented level
- **Financial impact** — Estimated claim value, at-risk amount, and recovery potential using Medicare rates
- **Smart code suggestions** — AI recommends CPT/ICD-10 codes with confidence levels
- **Addendum generator** — Creates compliant addendum text to close documentation gaps
- **Batch analysis** — Process up to 20 notes in one request
- **Template library** — 20+ pre-written clinical templates with placeholders
- **File upload** — Drag-and-drop PDF, CCDA/CCD (XML), and TXT files
- **Provider dashboard** — Analysis history, score distribution charts, weekly activity
- **Dark mode** — Full dark theme with system preference detection
- **Mobile responsive** — Works from 375px (iPhone SE) to desktop

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 (Vite), Tailwind CSS 3 |
| Backend (prod) | Vercel serverless functions (Node.js) |
| Backend (local) | Express.js on port 3001 |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Document parsing | `pdf-parse`, `fast-xml-parser` |
| Database | None — stateless API, localStorage for UI history |

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/aabdur1/docdefend-mvp.git
cd docdefend-mvp

# Install dependencies
npm install
cd client && npm install
cd ../server && npm install

# Add your API key
cp .env.example server/.env
# Edit server/.env and add your ANTHROPIC_API_KEY

# Start the backend (terminal 1)
cd server && npm start          # Express on :3001

# Start the frontend (terminal 2)
cd client && npm run dev        # Vite on :5173, proxies /api to :3001
```

You can also enter your API key directly in the app UI.

## Project Structure

```
docdefend-mvp/
├── api/                    # Vercel serverless functions (production)
│   ├── analyze.js          # POST /api/analyze — main analysis
│   ├── analyze-batch.js    # POST /api/analyze-batch — batch processing
│   ├── suggest-codes.js    # POST /api/suggest-codes — AI code suggestions
│   ├── generate-addendum.js# POST /api/generate-addendum
│   ├── upload.js           # POST /api/upload — PDF/XML/TXT parsing
│   ├── health.js           # GET  /api/health
│   ├── templates/          # GET  /api/templates
│   └── lib/                # Shared prompts, parsers, helpers
├── client/                 # React SPA
│   └── src/
│       ├── components/     # UI components
│       ├── context/        # API key context
│       └── data/           # Sample notes, reimbursement rates
├── server/                 # Express backend (local dev only)
├── sample-files/           # Example documents for upload testing
├── vercel.json             # Deployment config
└── HIPAA_COMPLIANCE.md     # Production PHI strategy
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/analyze` | Main defensibility analysis |
| `POST` | `/api/analyze-batch` | Batch analysis (up to 20 notes) |
| `POST` | `/api/suggest-codes` | AI code suggestions with confidence |
| `POST` | `/api/generate-addendum` | Generate compliant addendum text |
| `POST` | `/api/upload` | Parse uploaded document (PDF/XML/TXT) |
| `GET`  | `/api/templates` | List all clinical templates |
| `GET`  | `/api/templates/:id` | Get single template by ID |
| `GET`  | `/api/health` | Health check |

## Sample Data

The app includes **6 synthetic clinical notes** covering various pain management encounters. Notes 5-6 have intentional documentation gaps for demo purposes. Also includes 12 CPT codes, 9 ICD-10 codes, and Medicare reimbursement rates for financial impact calculations.

## Deployment

Deployed on **Vercel** — the frontend builds as a static SPA from `client/dist`, and API routes run as serverless functions from `api/`. See `vercel.json` for configuration.

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...    # Required for server-side analysis
PORT=3001                        # Express server port (local dev only)
```

## HIPAA Compliance

This MVP is for demonstration purposes only. See [HIPAA_COMPLIANCE.md](./HIPAA_COMPLIANCE.md) for the production strategy using AWS Bedrock with a BAA. A formal HIPAA risk assessment is required before processing real patient data.

## Important Notes

- **DEMO ONLY** — uses synthetic patient notes. Never use real PHI.
- **No authentication** — demo app. Production would need auth + access controls.
- **File upload limit** — 10MB max.
- **Batch limit** — 20 notes per request.

## License

This project was built for academic purposes as part of IDS 594 at Loyola University Chicago.
