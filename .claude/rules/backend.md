When working on files in `server/`:

- Single entry point: `server/index.js` (all routes)
- Claude SDK timeout: pass as request option (`messages.create({...}, { timeout })`), NOT inside body params
- `parseClaudeJSON()` strips markdown fences before JSON.parse. Never leak raw Claude output to client.
- `safeErrorMessage()` sanitizes all errors. Never expose SDK internals.
- Rate limits: 10 AI req/min, 60 general req/min per IP
- File upload: 10MB max via multer. Batch: 20 notes max, 3 concurrent.
- Input validation: code arrays must be non-empty strings, request bodies capped at 1MB
- Downcoding detection (`downcodeRules.js`) is deterministic (no AI call, instant). Rules load from `server/data/*.json` via `rulesLoader.js` with hardcoded fallback.
- `/api/admin/reload-rules` requires `x-admin-key` header in production; open in dev
- ESM modules (`"type": "module"`) throughout
- CORS: `docdefend.vercel.app` + `docdefend.health` in prod, `*` in dev
