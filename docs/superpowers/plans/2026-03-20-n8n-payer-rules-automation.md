# n8n Payer Rules Automation Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded payer downcoding rules (`server/downcodeRules.js`) with a dynamic JSON data file that is automatically updated by an n8n workflow — monitoring payer policy pages, extracting structured rules via Claude, and pushing updates to the repo or a future database.

**Architecture:** n8n workflow runs weekly, scrapes known payer policy URLs, sends content to Claude API for structured extraction, diffs against current rules, and either commits updated JSON to the repo (triggering Render redeploy) or writes to Supabase (when persistence layer is added). A manual review step (Slack/email alert) is included before rules go live. The Express server loads rules from a JSON file instead of hardcoded constants.

**Tech Stack:** n8n (cloud or self-hosted), Anthropic Claude API, GitHub API (for commits), Slack or email (for alerts), optional Supabase (future)

**Prerequisites:**
- `server/downcodeRules.js` is already built (hardcoded v1 — done)
- n8n account (free tier: 300 executions/month — sufficient for weekly runs)
- Anthropic API key (same one used by DocDefend)
- GitHub personal access token (for repo commits via n8n)

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| **Create** | `server/data/downcode-policies.json` | Dynamic rules file loaded at runtime. Source of truth for payer downcoding policies. Updated by n8n pipeline. |
| **Create** | `server/data/cms-peer-benchmarks.json` | CMS E/M utilization data by specialty. Updated annually by n8n. |
| **Create** | `server/data/dx-complexity-overrides.json` | Optional overrides to the ICD-10 complexity map (for when payers add new codes mid-year). Merged into `DX_COMPLEXITY_MAP` at load time by `rulesLoader.js`. |
| **Modify** | `server/downcodeRules.js` | Refactor to load from JSON files instead of hardcoded constants. Add hot-reload capability. |
| **Create** | `server/rulesLoader.js` | Module that reads JSON data files, validates schema, and provides a reload function. |
| **Modify** | `server/index.js` | Add `/api/admin/reload-rules` endpoint (for manual trigger after n8n push). |
| **Create** | `n8n/payer-policy-workflow.json` | Exportable n8n workflow definition (the main automation). |
| **Create** | `n8n/cms-benchmark-workflow.json` | Exportable n8n workflow for annual CMS data update. |
| **Create** | `n8n/README.md` | Setup instructions for the n8n workflows. |

---

## Task 1: Extract Hardcoded Rules to JSON Data Files

**Files:**
- Create: `server/data/downcode-policies.json`
- Create: `server/data/cms-peer-benchmarks.json`

- [ ] **Step 1: Create the data directory**

```bash
mkdir -p server/data
```

- [ ] **Step 2: Write `downcode-policies.json`**

Extract the `DOWNCODE_POLICIES` object from `downcodeRules.js` into a standalone JSON file. Structure:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-03-20T00:00:00Z",
  "updatedBy": "manual",
  "policies": {
    "cigna": {
      "id": "cigna_r49",
      "name": "Cigna R49 — E/M Coding Accuracy",
      "payer": "Cigna",
      "effectiveDate": "2025-10-01",
      "status": "active",
      "targetCodes": ["99204", "99205", "99214", "99215", "99244", "99245"],
      "mechanism": "one-level-down",
      "description": "...",
      "bypassRules": "...",
      "source": "https://..."
    }
  }
}
```

Include `version`, `lastUpdated`, and `updatedBy` metadata fields so the system knows when rules were last refreshed and whether it was manual or automated.

- [ ] **Step 3: Write `cms-peer-benchmarks.json`**

Extract `PEER_BENCHMARKS` into JSON:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-03-20T00:00:00Z",
  "source": "CMS Medicare Physician & Other Practitioners",
  "dataYear": 2024,
  "benchmarks": {
    "family_medicine": {
      "label": "Family Medicine",
      "99213": 0.45,
      "99214": 0.38,
      "99215": 0.08
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add server/data/
git commit -m "feat: extract downcoding rules and benchmarks to JSON data files"
```

---

## Task 2: Build the Rules Loader Module

**Files:**
- Create: `server/rulesLoader.js`

- [ ] **Step 1: Write `rulesLoader.js`**

This module reads the JSON data files, validates their structure, caches them in memory, and exposes a `reload()` function:

```js
// server/rulesLoader.js
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');

let policies = null;
let benchmarks = null;
let dxOverrides = null;
let lastLoadTime = null;

/**
 * Load (or reload) all rule data files from disk.
 * Call on server start and after n8n pushes updates.
 */
export function loadRules() {
  try {
    const policiesRaw = readFileSync(join(DATA_DIR, 'downcode-policies.json'), 'utf-8');
    policies = JSON.parse(policiesRaw);

    const benchmarksRaw = readFileSync(join(DATA_DIR, 'cms-peer-benchmarks.json'), 'utf-8');
    benchmarks = JSON.parse(benchmarksRaw);

    // Optional overrides file (may not exist)
    try {
      const overridesRaw = readFileSync(join(DATA_DIR, 'dx-complexity-overrides.json'), 'utf-8');
      dxOverrides = JSON.parse(overridesRaw);
    } catch {
      dxOverrides = null;
    }

    lastLoadTime = new Date().toISOString();
    console.log(`[rulesLoader] Loaded rules: ${Object.keys(policies.policies).length} policies, ${Object.keys(benchmarks.benchmarks).length} specialties`);
    return true;
  } catch (err) {
    console.error('[rulesLoader] Failed to load rules:', err.message);
    return false;
  }
}

export function getPolicies() { return policies; }
export function getBenchmarks() { return benchmarks; }
export function getDxOverrides() { return dxOverrides; }
export function getLastLoadTime() { return lastLoadTime; }
```

- [ ] **Step 2: Verify it loads the JSON files**

```bash
node --input-type=module -e "import { loadRules, getPolicies } from './rulesLoader.js'; loadRules(); console.log(Object.keys(getPolicies().policies));"
```

Expected: `['cigna', 'aetna', 'united', 'bcbs']`

- [ ] **Step 3: Commit**

```bash
git add server/rulesLoader.js
git commit -m "feat: add rules loader module for dynamic JSON data files"
```

---

## Task 3: Refactor `downcodeRules.js` to Use Dynamic Data

**Files:**
- Modify: `server/downcodeRules.js`

- [ ] **Step 1: Replace hardcoded `DOWNCODE_POLICIES` with loaded data**

At the top of `downcodeRules.js`, replace the hardcoded `DOWNCODE_POLICIES` export with a function that reads from the loader:

```js
import { getPolicies, getBenchmarks } from './rulesLoader.js';

// Fallback to hardcoded if JSON not loaded (backward compatibility)
export function getPolicy(payerId) {
  const loaded = getPolicies();
  if (loaded?.policies?.[payerId]) return loaded.policies[payerId];
  return DOWNCODE_POLICIES_FALLBACK[payerId] || null;
}
```

Keep the hardcoded `DOWNCODE_POLICIES` as `DOWNCODE_POLICIES_FALLBACK` so the system still works if JSON files are missing.

- [ ] **Step 2: Replace hardcoded `PEER_BENCHMARKS` similarly**

```js
export function getPeerBenchmark(specialty) {
  const loaded = getBenchmarks();
  if (loaded?.benchmarks?.[specialty]) return loaded.benchmarks[specialty];
  return PEER_BENCHMARKS_FALLBACK[specialty] || PEER_BENCHMARKS_FALLBACK.default;
}
```

- [ ] **Step 3: Update `checkDowncodeRisk()` and `getDowncodePolicies()` to use the dynamic getters**

Replace direct `DOWNCODE_POLICIES[payerId]` references with `getPolicy(payerId)` and `PEER_BENCHMARKS[specialty]` with `getPeerBenchmark(specialty)`.

Also update `getDowncodePolicies()` — it currently uses `Object.values(DOWNCODE_POLICIES)` directly and is called by the `/api/downcode-policies` endpoint. It must read from the loaded data first:

```js
export function getDowncodePolicies() {
  const loaded = getPolicies();
  const source = loaded?.policies || DOWNCODE_POLICIES_FALLBACK;
  return Object.values(source).map(p => ({
    id: p.id, name: p.name, payer: p.payer,
    status: p.status, effectiveDate: p.effectiveDate, targetCodes: p.targetCodes,
  }));
}
```

- [ ] **Step 4: Test that existing behavior is unchanged**

Run the same test commands from the hardcoded v1:

```bash
node --input-type=module -e "
import { loadRules } from './rulesLoader.js';
import { checkDowncodeRisk } from './downcodeRules.js';
loadRules();
const r = checkDowncodeRisk('cigna', '99214', ['I10'], ['99214']);
console.log(r.riskLevel, r.financialImpact?.formatted);
"
```

Expected: `MEDIUM { submitted: '$132', predicted: '$92', loss: '-$40' }`

**Note:** After Task 3 but before Task 4 is integrated, `loadRules()` must be called manually in tests. Once Task 4 adds `loadRules()` to server startup, it runs automatically. Until then, the system gracefully falls back to hardcoded values — this is intentional.

- [ ] **Step 5: Commit**

```bash
git add server/downcodeRules.js
git commit -m "refactor: load downcoding rules from JSON data files with hardcoded fallback"
```

---

## Task 4: Add Rules Reload Endpoint

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Import and initialize the rules loader at server startup**

In `index.js`, after imports:

```js
import { loadRules, getLastLoadTime } from './rulesLoader.js';

// Load rules on startup
loadRules();
```

- [ ] **Step 2: Add admin reload endpoint**

This endpoint is called by n8n after it pushes updated JSON files, or manually for testing. No auth for v1 (add API key check when this goes to production).

```js
// Reload downcoding rules from data files (called by n8n after update)
app.post('/api/admin/reload-rules', (req, res) => {
  const success = loadRules();
  res.json({
    success,
    lastLoadTime: getLastLoadTime(),
    message: success ? 'Rules reloaded successfully' : 'Failed to reload rules — using previous version',
  });
});
```

- [ ] **Step 3: Add rules metadata to health endpoint**

```js
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    rulesLastLoaded: getLastLoadTime(),
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add server/index.js
git commit -m "feat: add /api/admin/reload-rules endpoint and rules init on startup"
```

---

## Task 5: Build the n8n Payer Policy Monitoring Workflow

**Files:**
- Create: `n8n/payer-policy-workflow.json`
- Create: `n8n/README.md`

This is the core automation. The workflow runs weekly and does:
1. Fetch payer policy pages
2. Extract rules via Claude
3. Diff against current rules
4. Alert human if changes detected
5. (After human approval) Push updated JSON to GitHub

- [ ] **Step 1: Document the workflow architecture in `n8n/README.md`**

```markdown
# n8n Payer Rules Automation

## Workflows

### 1. Payer Policy Monitor (`payer-policy-workflow.json`)
- **Schedule:** Every Monday at 8am CT
- **Flow:** Fetch pages → Claude extraction → Diff → Slack alert → (manual approval) → GitHub commit → Render redeploy

### 2. CMS Benchmark Update (`cms-benchmark-workflow.json`)
- **Schedule:** Every January 15 (annual)
- **Flow:** Download CMS CSV → Parse → Update JSON → GitHub commit

## Setup

### Prerequisites
- n8n account (cloud or self-hosted)
- Credentials to configure in n8n:
  - **Anthropic API Key** — same key as DocDefend server
  - **GitHub Personal Access Token** — repo scope for docdefend-mvp
  - **Slack Webhook URL** (or email SMTP) — for change alerts

### Import Workflows
1. In n8n, go to Workflows → Import
2. Upload `payer-policy-workflow.json`
3. Configure credentials in each node
4. Activate the workflow

### Monitored URLs
| Payer | URL | What to Watch |
|-------|-----|---------------|
| Cigna | `https://providernewsroom.com/cigna-healthcare/` | R49 policy updates, pauses, expansions |
| Aetna | `https://www.aetna.com/health-care-professionals/` | CCRP program changes |
| UHC | `https://www.uhcprovider.com/` | E/M adjustment policy updates |
| Anthem BCBS | `https://www.anthem.com/provider/` | E/M coding review policy |
| AMA | `https://www.ama-assn.org/practice-management/` | Payer downcoding resource tracker |
| CMA | `https://www.cmadocs.org/newsroom/` | CA regulatory actions on downcoding |
```

- [ ] **Step 2: Design the n8n workflow nodes**

The workflow consists of these nodes (build in n8n's visual editor):

**Node 1: Schedule Trigger**
- Type: `Schedule Trigger`
- Config: Every Monday at 08:00 America/Chicago

**Node 2: HTTP Request (Cigna)**
- Type: `HTTP Request`
- URL: `https://providernewsroom.com/cigna-healthcare/`
- Method: GET
- Response Format: Text (HTML)
- On error: Continue (don't fail workflow)

**Node 3: HTTP Request (Aetna)**
- Same pattern, URL: `https://www.aetna.com/health-care-professionals/clinical-policy-bulletins.html`

**Node 4: HTTP Request (UHC)**
- Same pattern

**Node 5: HTTP Request (AMA Tracker)**
- Same pattern, URL for AMA payer downcoding resource page

**Node 6: Merge**
- Combine all HTTP responses into a single payload

**Node 7: Claude AI (Extract Rules)**
- Type: `Anthropic` (n8n has a built-in Anthropic node)
- Model: `claude-sonnet-4-20250514`
- System prompt:
```
You are a healthcare policy analyst. Extract all E/M downcoding policies from
the provided web page content. For each policy found, return structured JSON:

{
  "policies": [
    {
      "payerId": "cigna|aetna|united|bcbs|other",
      "policyId": "short_identifier",
      "name": "Policy display name",
      "effectiveDate": "YYYY-MM-DD",
      "status": "active|paused|withdrawn|proposed",
      "targetCodes": ["99214", "99215", ...],
      "mechanism": "one-level-down|adjust-to-deemed-level|other",
      "description": "What the policy does",
      "bypassRules": "How providers can opt out or appeal",
      "source": "URL where this was found",
      "changeDetected": "What changed from typical policy (new, modified, paused, etc.)"
    }
  ],
  "noChangesDetected": true/false,
  "summary": "One-line summary of what was found or changed"
}

If the page content doesn't contain downcoding policy information, return
{"policies": [], "noChangesDetected": true, "summary": "No policy content found"}.
```

**Node 8: GitHub — Read Current Rules**
- Type: `GitHub`
- Operation: Get File Content
- Repo: `[your-org]/docdefend-mvp`
- Path: `server/data/downcode-policies.json`

**Node 9: Code (Diff)**
- Type: `Code` (JavaScript)
- Compare Claude's extracted policies against current rules
- Output: `{ hasChanges: boolean, changes: [...], updatedPoliciesJson: "..." }`

```js
// n8n Code node
const extracted = $input.item.json.claudeResult;
const current = JSON.parse($input.item.json.currentRules);

const hasChanges = extracted.policies.length > 0 && !extracted.noChangesDetected;

if (!hasChanges) {
  return [{ json: { hasChanges: false, message: 'No policy changes detected' } }];
}

// Build updated policies JSON
const updated = { ...current };
updated.lastUpdated = new Date().toISOString();
updated.updatedBy = 'n8n-automation';

for (const policy of extracted.policies) {
  if (policy.payerId && updated.policies[policy.payerId]) {
    // Update existing policy
    Object.assign(updated.policies[policy.payerId], {
      status: policy.status,
      effectiveDate: policy.effectiveDate,
      description: policy.description,
      source: policy.source,
    });
  }
}

return [{
  json: {
    hasChanges: true,
    changes: extracted.policies.map(p => p.changeDetected),
    summary: extracted.summary,
    updatedPoliciesJson: JSON.stringify(updated, null, 2),
  }
}];
```

**Node 10: IF (Has Changes?)**
- Type: `IF`
- Condition: `{{ $json.hasChanges }} === true`

**Node 11: Slack Alert (changes detected)**
- Type: `Slack`
- Channel: `#docdefend-alerts` (or email if preferred)
- Message:
```
:rotating_light: *Payer Downcoding Policy Update Detected*

{{ $json.summary }}

Changes:
{{ $json.changes.join('\n- ') }}

Review and approve in the n8n workflow to push updates.
```

**Node 12: Wait for Approval**
- Type: `Wait`
- Resume: On webhook (manual approval URL sent in Slack message)
- Timeout: 72 hours (auto-skip if not approved)

**Node 13: GitHub — Commit Updated Rules**
- Type: `GitHub`
- Operation: Create or Update File
- Repo: `[your-org]/docdefend-mvp`
- Path: `server/data/downcode-policies.json`
- Content: `{{ $json.updatedPoliciesJson }}`
- Commit message: `chore(rules): auto-update payer downcoding policies [n8n]`
- Branch: `main`

**Node 14: Wait for Render Redeploy**
- Type: `Wait`
- Duration: 90 seconds
- (Render free tier takes 30-60s to redeploy after a GitHub push. The `loadRules()` call in server startup will automatically load the new JSON on redeploy, so this explicit reload is a belt-and-suspenders confirmation.)

**Node 15: HTTP Request (Verify Reload)**
- Type: `HTTP Request`
- URL: `https://docdefend-mvp.onrender.com/api/health`
- Method: GET
- (Check `rulesLastLoaded` timestamp to confirm the new rules are live. If the server is still cold-starting, this request will wake it up and it will load the fresh JSON on startup.)

**Node 16: Slack Confirmation**
- Message: `:white_check_mark: Payer rules updated and deployed successfully. Rules last loaded: {{ $json.rulesLastLoaded }}`

**Note on branch strategy:** For v1, committing directly to `main` is acceptable since only JSON data files change (no code), and the Slack approval step provides human review. For production, consider having n8n push to a `rules-update` branch and auto-create a PR instead — this adds code review and an audit trail.

- [ ] **Step 3: Export the workflow as JSON**

In n8n: Menu → Export → save as `n8n/payer-policy-workflow.json`

- [ ] **Step 4: Commit**

```bash
git add n8n/
git commit -m "feat: add n8n payer policy monitoring workflow and setup docs"
```

---

## Task 6: Build the CMS Benchmark Update Workflow

**Files:**
- Create: `n8n/cms-benchmark-workflow.json`

This is simpler — runs once a year to update E/M utilization benchmarks.

- [ ] **Step 1: Design the workflow**

**Node 1: Schedule Trigger** — January 15, annually

**Node 2: HTTP Request** — Download CMS Medicare Physician data
- URL: CMS publishes CSV files at `https://data.cms.gov/` (Medicare Physician & Other Practitioners)
- Download the E/M utilization by specialty report

**Node 3: Code (Parse CSV)**
- Parse the CSV, extract E/M code distribution by specialty
- Output structured JSON matching `cms-peer-benchmarks.json` format

**Node 4: GitHub Commit** — Update `server/data/cms-peer-benchmarks.json`

**Node 5: Slack Alert** — Notify that benchmarks were updated

- [ ] **Step 2: Export and commit**

```bash
git add n8n/cms-benchmark-workflow.json
git commit -m "feat: add n8n CMS benchmark annual update workflow"
```

---

## Task 7: Add Cigna to the Payer Selector UI

**Files:**
- Modify: `server/payerRules.js` — add Cigna payer entry
- Modify: `client/src/components/PayerSelector.jsx` — add Cigna option

Currently `payerRules.js` has Medicare, UHC, Aetna, and BCBS. Cigna needs to be added since it has the most aggressive downcoding policy (R49). This makes the downcoding detection feature visible for Cigna in the UI.

- [ ] **Step 1: Add Cigna to `payerRules.js`**

Add a `cigna` entry to the `PAYERS` object with Cigna-specific documentation rules and approximate commercial rates. Use the same structure as existing payers.

- [ ] **Step 2: Add Cigna option to `PayerSelector.jsx`**

`PayerSelector.jsx` has a **hardcoded** `PAYER_OPTIONS` array — it does NOT auto-discover from the server. Manually add a fifth entry for Cigna with an inline SVG icon and Tailwind color classes matching the existing pattern. Use teal or orange as the brand color. The grid currently uses `grid-cols-2 sm:grid-cols-4` — update to `sm:grid-cols-5` or keep 4-col and let Cigna wrap to a second row.

- [ ] **Step 3: Test end-to-end**

Select Cigna in the UI, run an analysis with a 99214 + single chronic diagnosis, verify the downcoding warning appears.

- [ ] **Step 4: Commit**

```bash
git add server/payerRules.js client/src/components/PayerSelector.jsx
git commit -m "feat: add Cigna as selectable payer with R49 downcoding detection"
```

---

## Task 8: Production Hardening

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Add API key auth to `/api/admin/reload-rules`**

```js
app.post('/api/admin/reload-rules', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... existing reload logic
});
```

Set `ADMIN_API_KEY` as an env var on Render. Configure the same key in the n8n HTTP Request node.

- [ ] **Step 2: Add file-watching for local dev**

In development, watch the data directory for changes and auto-reload:

```js
if (process.env.NODE_ENV !== 'production') {
  import('fs').then(fs => {
    fs.watch(join(__dirname, 'data'), () => {
      console.log('[dev] Data file changed — reloading rules');
      loadRules();
    });
  });
}
```

- [ ] **Step 3: Add rules staleness warning**

If rules haven't been updated in 30+ days, log a warning on server start and include it in the health check:

```js
const daysSinceUpdate = policies?.lastUpdated
  ? Math.floor((Date.now() - new Date(policies.lastUpdated)) / 86400000)
  : null;
if (daysSinceUpdate > 30) {
  console.warn(`[rulesLoader] WARNING: Rules are ${daysSinceUpdate} days old`);
}
```

- [ ] **Step 4: Commit**

```bash
git add server/index.js server/rulesLoader.js
git commit -m "feat: add admin auth, file watching, and staleness warning for rules"
```

---

## Execution Order & Dependencies

```
Task 1 (JSON files) ─────► Task 2 (loader) ─────► Task 3 (refactor) ─────► Task 4 (endpoint)
                                                                                    │
Task 5 (n8n policy workflow) ◄──────────────────────────────────────────────────────┘
Task 6 (n8n CMS workflow) ◄─────────────────────────────────────────────────────────┘
Task 7 (Cigna UI) — fully independent, can run anytime (modifies payerRules.js + PayerSelector.jsx, not JSON data files)
Task 8 (hardening) — run last

Note: Tasks 5-6 require manual work in the n8n GUI — they cannot be fully automated by an agentic worker. The plan describes the workflow design; the JSON export is produced after building in the n8n visual editor.
```

Tasks 1-4 are the code changes. Tasks 5-6 are n8n configuration (done in the n8n UI, exported as JSON). Task 7 is a UI enhancement. Task 8 is production hardening.

---

## Cost Estimate

| Resource | Cost | Notes |
|----------|------|-------|
| n8n Cloud (free tier) | $0/month | 300 executions/month, more than enough for weekly + annual |
| Claude API calls (n8n) | ~$0.10/week | ~4 pages scraped, ~2000 tokens each, extraction prompt |
| GitHub API | Free | Personal access token, no rate limit concerns at this volume |
| Slack | Free | Webhook, no paid plan needed |

Total incremental cost: **~$0.40/month**
