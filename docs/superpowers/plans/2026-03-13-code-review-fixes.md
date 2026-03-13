# Code Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical and important bugs identified in the comprehensive code review.

**Architecture:** These are targeted fixes across server and client code — no new features, only corrections to existing behavior. Grouped by file proximity to minimize context switching and enable parallel execution.

**Tech Stack:** React 18, Express.js, Vite, Tailwind CSS

---

## File Map

| File | Changes |
|------|---------|
| `client/src/components/Toast.jsx` | Fix `useCallback` → `useMemo`, stabilize `onRemove` |
| `client/src/App.jsx` | Guard mode toggles during loading, fix EmptyState coder logic, add coder history |
| `client/src/components/AnalysisReport.jsx` | Handle `isCoderReview` reports |
| `client/src/components/EMLevelCard.jsx` | Support coder-review recommended codes |
| `client/src/components/Dashboard.jsx` | Remove donut fallbacks, add focus trap |
| `client/src/components/CodeSuggestions.jsx` | Clear stale suggestions on note change |
| `client/src/components/CodeSelector.jsx` | Clear custom codes on parent reset |
| `client/src/components/AddendumGenerator.jsx` | Guard `response.json()` on error path |
| `client/src/components/BatchAnalysis.jsx` | Fix progress counter order, pass props to AnalysisReport |
| `client/src/components/ScoreRing.jsx` | Guard `document` access |
| `client/src/context/ApiKeyContext.jsx` | Treat missing timestamp as expired |
| `client/vite.config.js` | Disable modulePreload polyfill |
| `server/index.js` | Fix ICD-10 regex, cap array lengths, remove unused import |
| `server/suggestions.js` | Whitelist `payerId` against PAYERS |

---

## Chunk 1: Critical — Toast, CSP, Prompt Injection

### Task 1: Fix Toast `useCallback` → `useMemo` and stabilize `onRemove`

**Files:**
- Modify: `client/src/components/Toast.jsx`

- [ ] **Step 1: Replace `useCallback` with `useMemo` for toast context value**

In `Toast.jsx`, change the import on line 1:
```javascript
import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
```

Replace lines 135–140:
```javascript
  const toast = useCallback({
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
  }, [addToast]);
```
With:
```javascript
  const toast = useMemo(() => ({
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
  }), [addToast]);
```

- [ ] **Step 2: Stabilize `onRemove` in ToastItem rendering**

Replace line 148:
```jsx
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
```
With:
```jsx
          <ToastItem key={t.id} toast={t} onRemove={removeToast} toastId={t.id} />
```

Then update the `ToastItem` component signature (line 13) and all usages of `onRemove`:

Replace line 13:
```javascript
function ToastItem({ toast, onRemove }) {
```
With:
```javascript
function ToastItem({ toast, onRemove, toastId }) {
```

Replace line 19 (`setTimeout(onRemove, 300)`):
```javascript
      setTimeout(onRemove, 300);
```
With:
```javascript
      setTimeout(() => onRemove(toastId), 300);
```

Replace line 22–23 (the dependency array):
```javascript
  }, [toast.duration, onRemove]);
```
With:
```javascript
  }, [toast.duration, onRemove, toastId]);
```

Replace lines 102–105 (the dismiss button onClick):
```javascript
        onClick={() => {
          setIsExiting(true);
          setTimeout(onRemove, 300);
        }}
```
With:
```javascript
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toastId), 300);
        }}
```

- [ ] **Step 3: Verify build**

```bash
cd mvp/docdefend-mvp/client && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd mvp/docdefend-mvp && git add client/src/components/Toast.jsx
git commit -m "fix: use useMemo for toast context, stabilize onRemove to prevent timer resets"
```

### Task 2: Disable Vite modulePreload polyfill to prevent CSP violation

**Files:**
- Modify: `client/vite.config.js`

- [ ] **Step 1: Add modulePreload config**

Replace lines 4–19:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: process.env.VERCEL
      ? undefined
      : {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
  },
});
```
With:
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: { polyfill: false },
  },
  server: {
    port: 5173,
    proxy: process.env.VERCEL
      ? undefined
      : {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
  },
});
```

- [ ] **Step 2: Verify production build has no inline scripts**

```bash
cd mvp/docdefend-mvp/client && npm run build && grep -c '<script' dist/index.html
```
Expected: only the `dark-mode-init.js` and `main.jsx` module script — no inline `<script>` blocks.

- [ ] **Step 3: Commit**

```bash
cd mvp/docdefend-mvp && git add client/vite.config.js
git commit -m "fix: disable Vite modulePreload polyfill to comply with script-src 'self' CSP"
```

### Task 3: Whitelist `payerId` in `buildCoderReviewPrompt`

**Files:**
- Modify: `server/suggestions.js`

- [ ] **Step 1: Import PAYERS and whitelist payerId**

Add import at top of `server/suggestions.js` (line 1):
```javascript
import { PAYERS } from './payerRules.js';
```

Replace the `buildCoderReviewPrompt` function (at the end of the file):
```javascript
export function buildCoderReviewPrompt(note, payerId) {
  const payerContext = payerId ? `\nPAYER: ${payerId}\nApply payer-specific rules if applicable.\n` : '';
```
With:
```javascript
export function buildCoderReviewPrompt(note, payerId) {
  const payerName = payerId && PAYERS[payerId] ? PAYERS[payerId].name : null;
  const payerContext = payerName ? `\nPAYER: ${payerName}\nApply payer-specific rules if applicable.\n` : '';
```

- [ ] **Step 2: Verify server module loads**

```bash
cd mvp/docdefend-mvp/server && node -e "import('./index.js').then(() => { console.log('OK'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); })"
```

- [ ] **Step 3: Commit**

```bash
cd mvp/docdefend-mvp && git add server/suggestions.js
git commit -m "fix: whitelist payerId against PAYERS to prevent prompt injection in code-review"
```

---

## Chunk 2: Server Fixes

### Task 4: Fix ICD-10 regex, cap array lengths, remove dead import

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Fix ICD-10 regex to accept alphanumeric extensions**

Replace line 37:
```javascript
const ICD10_REGEX = /^[A-Z]\d{2}(\.\d{1,4})?$/i;
```
With:
```javascript
const ICD10_REGEX = /^[A-Z]\d{2}(\.[A-Z0-9]{1,4})?$/i;
```

- [ ] **Step 2: Add array length caps to the `/api/analyze` endpoint**

Replace lines 188–193:
```javascript
    if (!isStringArray(cptCodes) || !cptCodes.every(isValidCptCode)) {
      return res.status(400).json({ error: 'At least one valid CPT code is required (5-digit format).' });
    }
    if (!isStringArray(icd10Codes) || !icd10Codes.every(isValidIcd10Code)) {
      return res.status(400).json({ error: 'At least one valid ICD-10 code is required (e.g., M54.5).' });
    }
```
With:
```javascript
    if (!isStringArray(cptCodes) || cptCodes.length > 20 || !cptCodes.every(isValidCptCode)) {
      return res.status(400).json({ error: 'Between 1 and 20 valid CPT codes required (5-digit format).' });
    }
    if (!isStringArray(icd10Codes) || icd10Codes.length > 50 || !icd10Codes.every(isValidIcd10Code)) {
      return res.status(400).json({ error: 'Between 1 and 50 valid ICD-10 codes required (e.g., M54.5).' });
    }
```

- [ ] **Step 3: Remove unused `systemPrompt` import**

Replace line 8:
```javascript
import { systemPrompt, buildSystemPrompt, buildUserPrompt } from './prompt.js';
```
With:
```javascript
import { buildSystemPrompt, buildUserPrompt } from './prompt.js';
```

- [ ] **Step 4: Verify server module loads**

```bash
cd mvp/docdefend-mvp/server && node -e "import('./index.js').then(() => { console.log('OK'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); })"
```

- [ ] **Step 5: Commit**

```bash
cd mvp/docdefend-mvp && git add server/index.js
git commit -m "fix: accept alphanumeric ICD-10 extensions, cap code array lengths, remove dead import"
```

---

## Chunk 3: App.jsx — Coder Mode Fixes

### Task 5: Guard mode toggles during loading, fix EmptyState, add coder history

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Guard mode toggles while loading**

Replace the Header props:
```jsx
        onToggleBatchMode={() => setBatchMode(prev => !prev)}
```
With:
```jsx
        onToggleBatchMode={() => { if (!loading) setBatchMode(prev => !prev); }}
```

Replace:
```jsx
        onToggleCoderMode={() => setCoderMode(prev => !prev)}
```
With:
```jsx
        onToggleCoderMode={() => { if (!loading) setCoderMode(prev => !prev); }}
```

- [ ] **Step 2: Fix EmptyState `hasCodes` prop in coder mode**

Replace:
```jsx
              {!report && !loading && !error && <EmptyState hasNote={!!note.trim()} hasCodes={coderMode || selectedCptCodes.length > 0 || selectedIcd10Codes.length > 0} />}
```
With:
```jsx
              {!report && !loading && !error && <EmptyState hasNote={!!note.trim()} hasCodes={coderMode ? false : selectedCptCodes.length > 0 || selectedIcd10Codes.length > 0} />}
```

Also update the EmptyState component to show appropriate step text for coder mode. In the `EmptyState` function, change the step 2 text:

Replace:
```jsx
        {step === 2 && 'Now select your billing codes.'}
```
With:
```jsx
        {step === 2 && (hasCodes !== false ? 'Now select your billing codes.' : 'Ready to analyze. Click the button below.')}
```

Wait — that doesn't work cleanly. Instead, update the EmptyState to accept `coderMode` as a prop.

Replace the EmptyState `hasCodes` prop in the JSX:
```jsx
              {!report && !loading && !error && <EmptyState hasNote={!!note.trim()} hasCodes={selectedCptCodes.length > 0 || selectedIcd10Codes.length > 0} coderMode={coderMode} />}
```

Update the `EmptyState` component signature:
```jsx
function EmptyState({ hasNote, hasCodes, coderMode }) {
```

Update the step computation inside `EmptyState`:
```javascript
  const step = coderMode
    ? (hasNote ? 3 : 1)
    : (hasCodes ? 3 : hasNote ? 2 : 1);
```

Update the step labels:
```jsx
        {step === 1 && 'Select a clinical note to get started.'}
        {step === 2 && 'Now select your billing codes.'}
        {step === 3 && 'Ready to analyze. Click the button below.'}
```
This works unchanged — in coder mode, step goes from 1 → 3 (skipping 2), which is correct since there are no codes to select.

Hide the codes step indicator in coder mode — wrap the "Codes" step circle and chevron:
```jsx
      {!coderMode && (
        <>
          <svg className={`w-4 h-4 transition-colors duration-300 ${chevronClass(1)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold transition-colors duration-300 ${stepClass(2)}`}>
              {step > 2 ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : '2'}
            </span>
            <span className={`transition-colors duration-300 ${labelClass(2)}`}>Codes</span>
          </div>
        </>
      )}
```

- [ ] **Step 3: Add coder-mode analysis to history**

In the `handleCoderAnalyze` function, after line `setReport({ ...data, isCoderReview: true });`, add:

```javascript
      // Save to history
      const historyEntry = {
        id: Date.now(),
        title: `Code Review — ${data.emLevelRecommendation?.recommendedLevel || 'Analysis'}`,
        codes: (data.suggestedCptCodes?.length || 0) + (data.suggestedIcd10Codes?.length || 0),
        date: new Date().toLocaleDateString(),
        score: data.suggestedCptCodes?.length > 0 ? 'HIGH' : 'MEDIUM',
        payer: selectedPayer || 'medicare',
      };
      const newHistory = [...analysisHistory, historyEntry].slice(-50);
      setAnalysisHistory(newHistory);
      localStorage.setItem('analysisHistory', JSON.stringify(newHistory));
```

- [ ] **Step 4: Verify build**

```bash
cd mvp/docdefend-mvp/client && npm run build
```

- [ ] **Step 5: Commit**

```bash
cd mvp/docdefend-mvp && git add client/src/App.jsx
git commit -m "fix: guard mode toggles during loading, fix EmptyState coder logic, add coder history"
```

---

## Chunk 4: Component Fixes (Parallel-Safe)

### Task 6: Handle `isCoderReview` in AnalysisReport + EMLevelCard

**Files:**
- Modify: `client/src/components/AnalysisReport.jsx`
- Modify: `client/src/components/EMLevelCard.jsx`

- [ ] **Step 1: Update EMLevelCard to support coder mode**

In `EMLevelCard.jsx`, update the signature at line 1:
```javascript
export default function EMLevelCard({ emLevelRecommendation, selectedCptCodes, isCoderReview }) {
```

Replace lines 87–98 (the "Selected" panel) with:
```jsx
        <div className="flex-1 text-center p-3 rounded-lg bg-[#F5EFE0]/60 dark:bg-instrument-bg-raised/60 border border-[#D6C9A8]/50 dark:border-instrument-border/50">
          {isCoderReview ? (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">AI Recommended</p>
              <p className="text-lg font-bold font-mono text-healthcare-500 dark:text-trace">{documentedLevel}</p>
            </>
          ) : selectedEM ? (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Selected</p>
              <p className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300">{selectedEM}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Selected</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">No E/M code</p>
            </>
          )}
        </div>
```

In coder mode, hide the arrow and "Documented Level" panel since we're showing just the recommendation. Wrap the arrow and documented level div (lines 100–111) with:
```jsx
        {!isCoderReview && (
          <>
            <div className="flex-shrink-0">
              <svg className={`w-6 h-6 ${config.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div className="flex-1 text-center p-3 rounded-lg bg-[#F5EFE0]/80 dark:bg-instrument-bg-raised/80 border-2 border-current/20 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Documented Level</p>
              <p className={`text-lg font-bold font-mono ${config.icon}`}>{documentedLevel}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{documentedLevelDescription}</p>
            </div>
          </>
        )}
```

- [ ] **Step 2: Pass `isCoderReview` through AnalysisReport**

In `AnalysisReport.jsx`, update the EMLevelCard call at line 313–316:
```jsx
            <EMLevelCard
              emLevelRecommendation={report.emLevelRecommendation}
              selectedCptCodes={selectedCptCodes}
              isCoderReview={report.isCoderReview}
            />
```

- [ ] **Step 3: Verify build**

```bash
cd mvp/docdefend-mvp/client && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd mvp/docdefend-mvp && git add client/src/components/AnalysisReport.jsx client/src/components/EMLevelCard.jsx
git commit -m "fix: handle isCoderReview in EMLevelCard — show AI recommendation instead of selected comparison"
```

### Task 7: Dashboard — remove donut fallbacks, add focus trap

**Files:**
- Modify: `client/src/components/Dashboard.jsx`

- [ ] **Step 1: Remove fake fallback values from donut chart**

Replace lines 205–209:
```javascript
  const riskDistribution = [
    { label: 'High', value: stats.highCount || 12, colorHex: '#2D6A4F' },
    { label: 'Medium', value: stats.mediumCount || 8, colorHex: '#f59e0b' },
    { label: 'Low', value: stats.lowCount || 3, colorHex: '#ef4444' },
  ];
```
With:
```javascript
  const riskDistribution = [
    { label: 'High', value: stats.highCount, colorHex: '#2D6A4F' },
    { label: 'Medium', value: stats.mediumCount, colorHex: '#f59e0b' },
    { label: 'Low', value: stats.lowCount, colorHex: '#ef4444' },
  ];
```

- [ ] **Step 2: Add focus trap to the panel's `onKeyDown` handler**

Replace line 227:
```javascript
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
```
With:
```javascript
        onKeyDown={(e) => {
          if (e.key === 'Escape') { onClose(); return; }
          if (e.key === 'Tab') {
            const focusable = panelRef.current?.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable || focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
```

- [ ] **Step 3: Verify build**

```bash
cd mvp/docdefend-mvp/client && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd mvp/docdefend-mvp && git add client/src/components/Dashboard.jsx
git commit -m "fix: remove fake donut fallback data, add Tab focus trap to Dashboard dialog"
```

### Task 8: Fix ApiKeyContext missing-timestamp bypass

**Files:**
- Modify: `client/src/context/ApiKeyContext.jsx`

- [ ] **Step 1: Treat missing timestamp as expired**

In `ApiKeyContext.jsx`, replace the expiration check block:
```javascript
    if (saved) {
      // Clear if older than 7 days
      if (timestamp && Date.now() - Number(timestamp) > API_KEY_MAX_AGE_MS) {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        localStorage.removeItem(API_KEY_TIMESTAMP_KEY);
        return;
      }
      setApiKey(saved);
    }
```
With:
```javascript
    if (saved) {
      // Clear if older than 7 days or missing timestamp
      if (!timestamp || Date.now() - Number(timestamp) > API_KEY_MAX_AGE_MS) {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        localStorage.removeItem(API_KEY_TIMESTAMP_KEY);
        return;
      }
      setApiKey(saved);
    }
```

- [ ] **Step 2: Commit**

```bash
cd mvp/docdefend-mvp && git add client/src/context/ApiKeyContext.jsx
git commit -m "fix: treat missing API key timestamp as expired to enforce 7-day policy"
```

### Task 9: Fix CodeSuggestions stale data + CodeSelector ghost custom codes

**Files:**
- Modify: `client/src/components/CodeSuggestions.jsx`
- Modify: `client/src/components/CodeSelector.jsx`

- [ ] **Step 1: Clear stale suggestions when note changes in CodeSuggestions**

Add `useEffect` import at line 1:
```javascript
import { useState, useEffect } from 'react';
```

After line 17 (`const { apiKey } = useApiKey();`), add:
```javascript
  // Clear stale suggestions when the note changes
  useEffect(() => {
    setSuggestions(null);
    setError(null);
    setApplied(false);
  }, [note]);
```

- [ ] **Step 2: Clear custom codes in CodeSelector when parent resets**

In `CodeSelector.jsx`, add `useEffect` to the import on line 1:
```javascript
import { useState, useRef, useCallback, useEffect } from 'react';
```

After line 119 (`const icd10DupTimer = useRef(null);`), add:
```javascript
  // Clear custom codes when parent resets all selections
  useEffect(() => {
    if (selectedCptCodes.length === 0) setCustomCptCodes([]);
  }, [selectedCptCodes.length]);

  useEffect(() => {
    if (selectedIcd10Codes.length === 0) setCustomIcd10Codes([]);
  }, [selectedIcd10Codes.length]);
```

- [ ] **Step 3: Verify build**

```bash
cd mvp/docdefend-mvp/client && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd mvp/docdefend-mvp && git add client/src/components/CodeSuggestions.jsx client/src/components/CodeSelector.jsx
git commit -m "fix: clear stale suggestions on note change, clear ghost custom codes on reset"
```

### Task 10: Fix AddendumGenerator error handling + BatchAnalysis progress + props

**Files:**
- Modify: `client/src/components/AddendumGenerator.jsx`
- Modify: `client/src/components/BatchAnalysis.jsx`

- [ ] **Step 1: Guard `response.json()` in AddendumGenerator error path**

In `AddendumGenerator.jsx`, replace lines 31–33:
```javascript
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate addendum');
      }
```
With:
```javascript
      if (!response.ok) {
        let message = 'Failed to generate addendum';
        try { const data = await response.json(); message = data.error || message; } catch {}
        throw new Error(message);
      }
```

- [ ] **Step 2: Move file size check before progress counter in BatchAnalysis**

In `BatchAnalysis.jsx`, rearrange the upload loop. Replace:
```javascript
    for (let i = 0; i < files.length; i++) {
      setUploadState(prev => ({ ...prev, current: i + 1 }));

      if (files[i].size > MAX_FILE_SIZE) {
        errors.push(`${files[i].name}: File too large (${(files[i].size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`);
        continue;
      }
```
With:
```javascript
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_FILE_SIZE) {
        errors.push(`${files[i].name}: File too large (${(files[i].size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`);
        continue;
      }

      setUploadState(prev => ({ ...prev, current: i + 1 }));
```

- [ ] **Step 3: Pass `selectedCptCodes` to AnalysisReport in batch rows**

In `BatchAnalysis.jsx`, replace line 636:
```jsx
                        <AnalysisReport report={row.analysis} note={row.note} />
```
With:
```jsx
                        <AnalysisReport report={row.analysis} note={row.note} selectedCptCodes={row.cptCodes} />
```

- [ ] **Step 4: Verify build**

```bash
cd mvp/docdefend-mvp/client && npm run build
```

- [ ] **Step 5: Commit**

```bash
cd mvp/docdefend-mvp && git add client/src/components/AddendumGenerator.jsx client/src/components/BatchAnalysis.jsx
git commit -m "fix: guard addendum JSON parse, fix batch progress order, pass codes to batch report"
```

### Task 11: Guard `document` access in ScoreRing

**Files:**
- Modify: `client/src/components/ScoreRing.jsx`

- [ ] **Step 1: Add typeof guard**

Replace line 42:
```javascript
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
```
With:
```javascript
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
```

- [ ] **Step 2: Commit**

```bash
cd mvp/docdefend-mvp && git add client/src/components/ScoreRing.jsx
git commit -m "fix: guard document access in ScoreRing for non-browser environments"
```

---

## Summary

| Chunk | Tasks | Theme |
|-------|-------|-------|
| 1 | Tasks 1–3 | Critical: Toast stability, CSP, prompt injection |
| 2 | Task 4 | Server: ICD-10 regex, array caps, dead import |
| 3 | Task 5 | App.jsx: mode toggle guards, EmptyState, coder history |
| 4 | Tasks 6–11 | Component fixes (parallel-safe, independent files) |

**Total: 11 tasks, ~14 files modified, 0 new files.**
