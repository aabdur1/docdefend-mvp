# Billing for Time Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Time-Based" billing mode that lets doctors declare total visit minutes, auto-maps to the correct CMS E/M code, and shifts the AI analysis from MDM criteria to time documentation validation.

**Architecture:** A new `BillingMethodSelector` component sits between the Clinical Note and Billing Codes cards. State lives in `App.jsx` and flows down. Two new optional fields (`billingMethod`, `totalMinutes`) are added to the `/api/analyze` request body. The server prompt is extended to evaluate time documentation when the method is TIME.

**Tech Stack:** React 18, Tailwind CSS 3, Express.js (ESM), Anthropic Claude API. No test framework — use manual browser verification.

**Branch:** `feat/billing-for-time` (already created, spec committed)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `client/src/data/reimbursementRates.js` | Modify | Add 99417 rate entry |
| `server/prompt.js` | Modify | Add billingMethod param to buildSystemPrompt + buildUserPrompt |
| `server/index.js` | Modify | Destructure + validate billingMethod/totalMinutes; pass to prompt builders |
| `client/src/components/BillingMethodSelector.jsx` | Create | Toggle UI, patient type, minutes input, CMS time→code mapping |
| `client/src/App.jsx` | Modify | Add 3 state vars, 2 handlers, render BillingMethodSelector, update fetch body, pass totalMinutes to AnalysisReport |
| `client/src/components/AnalysisReport.jsx` | Modify | Accept + forward totalMinutes prop to EMLevelCard |
| `client/src/components/EMLevelCard.jsx` | Modify | Accept totalMinutes prop; show time summary panel when methodology is TIME |

---

## Task 1: Add 99417 to reimbursementRates.js

**Files:**
- Modify: `client/src/data/reimbursementRates.js`

- [ ] **Step 1: Add the 99417 entry**

Open `client/src/data/reimbursementRates.js`. After the `'96372'` entry (last line in the object), add:

```js
  '99417': { rate: 40, description: 'Prolonged office visit, each additional 15 min' },
```

The bottom of the object should look like:

```js
  '96372': { rate: 25, description: 'Therapeutic injection' },
  '99417': { rate: 40, description: 'Prolonged office visit, each additional 15 min' },
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/data/reimbursementRates.js
git commit -m "feat: add 99417 prolonged services rate to reimbursement table"
```

---

## Task 2: Update server/prompt.js

**Files:**
- Modify: `server/prompt.js`

- [ ] **Step 1: Update buildSystemPrompt signature and add time-based instruction block**

In `server/prompt.js`, find `buildSystemPrompt(payerId)` at line 75. Replace the entire function with:

```js
export function buildSystemPrompt(payerId, billingMethod = 'MDM') {
  let prompt = baseSystemPrompt;

  if (billingMethod === 'TIME') {
    prompt += `

TIME-BASED BILLING MODE:
The provider has chosen to select their E/M level based on total time spent on the date of the encounter (CMS 2021+ guidelines), NOT Medical Decision Making. Your evaluation for the E/M code MUST focus entirely on time documentation criteria:

1. REQUIRED: The note must contain an explicit total time statement, e.g., "Total time spent on date of encounter: 45 minutes"
2. REQUIRED: The note should state or clearly imply that time was used to select the E/M level
3. RECOMMENDED: The note should list the activities contributing to that time (chart review, history, physical exam, counseling, ordering, documentation, care coordination)
4. RED FLAG: If the time statement appears generic or copied-forward rather than specific to this encounter, flag it as HIGH risk

Do NOT evaluate MDM criteria (problem complexity, data complexity, risk level) for the E/M code. Set mdmDetails to null. Evaluate only whether the time documentation would survive a CMS audit.`;
  }

  if (!payerId || payerId === 'medicare') {
    return prompt;
  }

  const payerRules = getPayerRules(payerId);
  const payerRates = getPayerRateTable(payerId);
  const payer = PAYERS[payerId];

  if (!payer) return prompt;

  const payerFindingsInstruction = `

PAYER-SPECIFIC ANALYSIS INSTRUCTIONS:
In addition to the standard analysis fields above, you MUST also include a "payerSpecificFindings" array in your JSON response. For each payer-specific rule listed above, evaluate whether the clinical note meets that requirement for the selected CPT codes. Only include findings for rules that are relevant to the selected codes.

Add this field to your JSON response:
  "payerSpecificFindings": [
    {
      "rule": "string — the payer-specific requirement being evaluated",
      "status": "NOT_MET" | "MET" | "PARTIALLY_MET",
      "detail": "string — specific explanation of what was or wasn't found in the note",
      "impact": "string — what happens if this requirement is not met (denial risk, prior auth needed, etc.)"
    }
  ]

If no payer-specific rules apply to the selected codes, return an empty array for payerSpecificFindings.`;

  return prompt + payerRules + payerRates + payerFindingsInstruction;
}
```

- [ ] **Step 2: Update buildUserPrompt signature to accept billingMethod and totalMinutes**

Find `buildUserPrompt(note, cptCodes, icd10Codes, payerId)` and replace it with:

```js
export function buildUserPrompt(note, cptCodes, icd10Codes, payerId, billingMethod = 'MDM', totalMinutes = null) {
  const payerContext = payerId && payerId !== 'medicare' && PAYERS[payerId]
    ? `\nPAYER: ${PAYERS[payerId].name}\n`
    : '';

  const timeContext = billingMethod === 'TIME' && totalMinutes
    ? `\nBILLING METHOD: Time-Based\nTotal time on date of encounter declared by provider: ${totalMinutes} minutes\nThe selected E/M code was automatically mapped from this time. Evaluate whether the clinical note defensibly supports time-based billing at this duration.\n`
    : '';

  return `CLINICAL NOTE:
${note}

BILLING CODES SELECTED:
CPT: ${cptCodes.join(', ')}
ICD-10: ${icd10Codes.join(', ')}${payerContext}${timeContext}
Analyze whether this clinical note defensibly supports the selected billing codes.`;
}
```

- [ ] **Step 3: Verify the file looks correct**

Run: `node -e "import('./server/prompt.js').then(m => console.log('OK')).catch(e => console.error(e))"` from the repo root.

Expected output: `OK`

- [ ] **Step 4: Commit**

```bash
git add server/prompt.js
git commit -m "feat: add time-based billing mode to system and user prompts"
```

---

## Task 3: Update server/index.js

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Destructure and validate the new fields**

Find the `app.post('/api/analyze', ...)` handler. The destructuring line currently reads:

```js
const { note, cptCodes, icd10Codes, payerId } = req.body;
```

Replace it with:

```js
const { note, cptCodes, icd10Codes, payerId, billingMethod, totalMinutes } = req.body;
const resolvedBillingMethod = billingMethod === 'TIME' ? 'TIME' : 'MDM';
```

Then, directly after the existing `icd10Codes` validation block, add:

```js
if (resolvedBillingMethod === 'TIME') {
  if (!Number.isInteger(totalMinutes) || totalMinutes < 1 || totalMinutes > 300) {
    return res.status(400).json({ error: 'totalMinutes must be an integer between 1 and 300 when using time-based billing.' });
  }
}
```

- [ ] **Step 2: Pass the new params to the prompt builders**

Find these two lines (currently ~line 253-254):

```js
const payerSystemPrompt = buildSystemPrompt(payerId);
const userPrompt = buildUserPrompt(note, cptCodes, icd10Codes, payerId);
```

Replace them with:

```js
const payerSystemPrompt = buildSystemPrompt(payerId, resolvedBillingMethod);
const userPrompt = buildUserPrompt(note, cptCodes, icd10Codes, payerId, resolvedBillingMethod, totalMinutes);
```

- [ ] **Step 3: Start the dev server and verify it accepts a TIME request**

Start the server: `cd server && npm run dev`

In a second terminal, send a test request:

```bash
curl -s -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:3001/api/login -H 'Content-Type: application/json' -d '{"username":"YOUR_USER","password":"YOUR_PASS"}' | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).token))")" \
  -d '{"note":"Patient seen today.","cptCodes":["99204"],"icd10Codes":["M54.5"],"billingMethod":"TIME","totalMinutes":45}' \
  | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{ const r=JSON.parse(d); console.log(r.error || 'emLevel:' + r.emLevelRecommendation?.methodology); })"
```

Expected output: `emLevel:TIME` (or a JSON error about the note being too short — either means the route accepted the new fields without a 400 validation error)

Also verify the bad-input guard works:

```bash
curl -s -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"note":"x","cptCodes":["99204"],"icd10Codes":["M54.5"],"billingMethod":"TIME","totalMinutes":999}' \
  | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).error))"
```

Expected: `totalMinutes must be an integer between 1 and 300 when using time-based billing.`

- [ ] **Step 4: Commit**

```bash
git add server/index.js
git commit -m "feat: validate and forward billingMethod/totalMinutes in analyze endpoint"
```

---

## Task 4: Create BillingMethodSelector.jsx

**Files:**
- Create: `client/src/components/BillingMethodSelector.jsx`

- [ ] **Step 1: Create the component file**

Create `client/src/components/BillingMethodSelector.jsx` with this content:

```jsx
import { useState, useRef, useEffect, useCallback } from 'react';

function mapTimeToCode(minutes, patientType) {
  const m = parseInt(minutes, 10);
  if (!m || m < 1) return null;

  if (patientType === 'new') {
    if (m < 15) return null;
    if (m < 30) return { emCode: '99202', prolongedCount: 0 };
    if (m < 45) return { emCode: '99203', prolongedCount: 0 };
    if (m < 60) return { emCode: '99204', prolongedCount: 0 };
    if (m < 75) return { emCode: '99205', prolongedCount: 0 };
    return { emCode: '99205', prolongedCount: Math.floor((m - 75) / 15) + 1 };
  } else {
    if (m < 10) return null;
    if (m < 20) return { emCode: '99212', prolongedCount: 0 };
    if (m < 30) return { emCode: '99213', prolongedCount: 0 };
    if (m < 40) return { emCode: '99214', prolongedCount: 0 };
    if (m < 55) return { emCode: '99215', prolongedCount: 0 };
    return { emCode: '99215', prolongedCount: Math.floor((m - 55) / 15) + 1 };
  }
}

function getCodeHint(minutes, patientType) {
  const result = mapTimeToCode(minutes, patientType);
  if (!result) {
    const minRequired = patientType === 'new' ? 15 : 10;
    return parseInt(minutes, 10) > 0 ? `Minimum ${minRequired} min required` : null;
  }
  const codes = [result.emCode, ...Array(result.prolongedCount).fill('99417')];
  return `→ ${codes.join(' + ')} auto-selected`;
}

function buildAutoSelectCodes(minutes, patientType) {
  const result = mapTimeToCode(minutes, patientType);
  if (!result) return [];
  return [result.emCode, ...Array(result.prolongedCount).fill('99417')];
}

export default function BillingMethodSelector({
  billingMethod,
  onBillingMethodChange,
  totalMinutes,
  onTotalMinutesChange,
  patientType,
  onPatientTypeChange,
  onCodeAutoSelect,
}) {
  const tabContainerRef = useRef(null);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    if (!tabContainerRef.current) return;
    const activeBtn = tabContainerRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      const containerRect = tabContainerRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setTabIndicator({ left: btnRect.left - containerRect.left, width: btnRect.width });
    }
  }, []);

  useEffect(() => { updateIndicator(); }, [billingMethod, updateIndicator]);

  useEffect(() => {
    let timeoutId;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateIndicator, 300);
    };
    window.addEventListener('resize', debouncedUpdate);
    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, [updateIndicator]);

  const handleMinutesChange = (value) => {
    onTotalMinutesChange(value);
    onCodeAutoSelect(buildAutoSelectCodes(value, patientType));
  };

  const handlePatientTypeChange = (type) => {
    onPatientTypeChange(type);
    if (totalMinutes) {
      onCodeAutoSelect(buildAutoSelectCodes(totalMinutes, type));
    }
  };

  const hint = billingMethod === 'TIME' ? getCodeHint(totalMinutes, patientType) : null;

  return (
    <div className="flex items-center gap-3 flex-wrap p-4 bg-[#EDE6D3] dark:bg-instrument-bg-surface rounded-xl border border-[#D6C9A8] dark:border-instrument-border">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
        Billing Method:
      </span>

      {/* MDM / Time toggle */}
      <div
        ref={tabContainerRef}
        role="radiogroup"
        aria-label="Billing method"
        className="relative flex gap-1 p-1 bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl"
      >
        <div
          className="absolute top-1 bottom-1 bg-healthcare-500 dark:bg-trace-dim rounded-lg shadow-sm transition-all duration-300 ease-out z-0"
          style={{ left: tabIndicator.left, width: tabIndicator.width }}
        />
        {['MDM', 'TIME'].map((method) => (
          <button
            key={method}
            type="button"
            role="radio"
            aria-checked={billingMethod === method}
            data-active={billingMethod === method}
            onClick={() => onBillingMethodChange(method)}
            className={`relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 ${
              billingMethod === method
                ? 'text-white'
                : 'text-slate-600 dark:text-instrument-text-muted hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {method === 'MDM' ? 'MDM-Based' : 'Time-Based'}
          </button>
        ))}
      </div>

      {/* Time-Based controls — shown only when TIME is active */}
      {billingMethod === 'TIME' && (
        <>
          {/* Patient type */}
          <div
            role="radiogroup"
            aria-label="Patient type"
            className="flex gap-1 p-1 bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl"
          >
            {[
              { value: 'new', label: 'New Patient' },
              { value: 'established', label: 'Established' },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={patientType === value}
                onClick={() => handlePatientTypeChange(value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  patientType === value
                    ? 'bg-healthcare-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-instrument-text-muted hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Minutes input */}
          <div className="flex items-center gap-2">
            <label htmlFor="billing-total-minutes" className="sr-only">
              Total time on date of encounter in minutes
            </label>
            <input
              id="billing-total-minutes"
              type="number"
              min="1"
              max="300"
              value={totalMinutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
              placeholder="e.g. 45"
              className="w-24 px-3 py-1.5 text-sm border border-[#D6C9A8] dark:border-instrument-border rounded-xl focus:ring-2 focus:ring-healthcare-500 focus:border-healthcare-500 bg-[#F5EFE0] dark:bg-instrument-bg-surface dark:text-white shadow-sm transition-shadow"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">min</span>
          </div>

          {/* Auto-select hint */}
          {hint && (
            <span
              className={`text-sm font-medium ${
                hint.startsWith('→')
                  ? 'text-healthcare-600 dark:text-healthcare-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {hint}
            </span>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the file was saved with no syntax errors**

Run from repo root:

```bash
node -e "
const fs = require('fs');
const code = fs.readFileSync('client/src/components/BillingMethodSelector.jsx', 'utf8');
console.log(code.includes('mapTimeToCode') ? 'OK' : 'MISSING mapTimeToCode');
console.log(code.includes('buildAutoSelectCodes') ? 'OK' : 'MISSING buildAutoSelectCodes');
"
```

Expected output:
```
OK
OK
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/BillingMethodSelector.jsx
git commit -m "feat: add BillingMethodSelector component with CMS time-to-code mapping"
```

---

## Task 5: Update App.jsx

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Add the OFFICE_EM_CODES constant**

Near the top of `App.jsx`, after the import statements and before the component definition, add:

```js
const OFFICE_EM_CODES = new Set([
  '99202', '99203', '99204', '99205',
  '99212', '99213', '99214', '99215',
  '99417',
]);
```

- [ ] **Step 2: Add the import for BillingMethodSelector**

In the imports section at the top of `App.jsx`, add alongside the other component imports:

```js
import BillingMethodSelector from './components/BillingMethodSelector';
```

- [ ] **Step 3: Add three new state variables**

Find the block of `useState` calls around line 221–232 (where `selectedCptCodes`, `selectedIcd10Codes`, `selectedPayer`, etc. are declared). Add these three lines immediately after the `batchMode` and `coderMode` state lines:

```js
const [billingMethod, setBillingMethod] = useState('MDM'); // 'MDM' | 'TIME'
const [totalMinutes, setTotalMinutes] = useState('');
const [patientType, setPatientType] = useState('new'); // 'new' | 'established'
```

- [ ] **Step 4: Add the two billing handlers**

Find the `handleAnalyze` function (around line 265). Add these two handler functions directly above it:

```js
const handleBillingMethodChange = (method) => {
  if (method === 'MDM') {
    setSelectedCptCodes(prev => prev.filter(c => !OFFICE_EM_CODES.has(c)));
    setTotalMinutes('');
  }
  setBillingMethod(method);
};

const handleCodeAutoSelect = (timeCodes) => {
  setSelectedCptCodes(prev => [
    ...prev.filter(c => !OFFICE_EM_CODES.has(c)),
    ...timeCodes,
  ]);
};
```

- [ ] **Step 5: Add billingMethod validation to the submit guard**

Find the `canAnalyze` constant (around line 261–263):

```js
const canAnalyze = coderMode
  ? note.trim().length > 0
  : note.trim() && selectedCptCodes.length > 0 && selectedIcd10Codes.length > 0;
```

Replace it with:

```js
const timeBasedValid = billingMethod !== 'TIME' || (totalMinutes && parseInt(totalMinutes, 10) >= 1);
const canAnalyze = coderMode
  ? note.trim().length > 0
  : note.trim() && selectedCptCodes.length > 0 && selectedIcd10Codes.length > 0 && timeBasedValid;
```

- [ ] **Step 6: Add billingMethod and totalMinutes to the fetch body**

Find the `JSON.stringify` call in `handleAnalyze` (around line 280–285):

```js
body: JSON.stringify({
  note,
  cptCodes: selectedCptCodes,
  icd10Codes: selectedIcd10Codes,
  payerId: selectedPayer || undefined,
}),
```

Replace it with:

```js
body: JSON.stringify({
  note,
  cptCodes: selectedCptCodes,
  icd10Codes: selectedIcd10Codes,
  payerId: selectedPayer || undefined,
  ...(billingMethod === 'TIME' && {
    billingMethod: 'TIME',
    totalMinutes: parseInt(totalMinutes, 10),
  }),
}),
```

- [ ] **Step 7: Render BillingMethodSelector between the Note card and the Billing Codes card**

Find this block in the JSX (around line 452–459):

```jsx
              {/* Smart Code Suggestions */}
              {note.trim() && (
                <div className="animate-fadeInUp">
                  <CodeSuggestions note={note} onSelectCodes={handleSelectSuggestedCodes} />
                </div>
              )}

              {/* Billing Codes Card — hidden in coder mode */}
```

Insert the BillingMethodSelector block between the Smart Code Suggestions block and the Billing Codes card comment, so it reads:

```jsx
              {/* Smart Code Suggestions */}
              {note.trim() && (
                <div className="animate-fadeInUp">
                  <CodeSuggestions note={note} onSelectCodes={handleSelectSuggestedCodes} />
                </div>
              )}

              {/* Billing Method Selector */}
              {!coderMode && (
                <div className="animate-fadeInUp stagger-2">
                  <BillingMethodSelector
                    billingMethod={billingMethod}
                    onBillingMethodChange={handleBillingMethodChange}
                    totalMinutes={totalMinutes}
                    onTotalMinutesChange={setTotalMinutes}
                    patientType={patientType}
                    onPatientTypeChange={setPatientType}
                    onCodeAutoSelect={handleCodeAutoSelect}
                  />
                </div>
              )}

              {/* Billing Codes Card — hidden in coder mode */}
```

- [ ] **Step 8: Pass totalMinutes to AnalysisReport**

Find the `AnalysisReport` call in the JSX (around line 642–647):

```jsx
                    <AnalysisReport
                      report={report}
                      note={note}
                      selectedCptCodes={selectedCptCodes}
                      selectedPayer={selectedPayer}
                    />
```

Replace it with:

```jsx
                    <AnalysisReport
                      report={report}
                      note={note}
                      selectedCptCodes={selectedCptCodes}
                      selectedPayer={selectedPayer}
                      totalMinutes={billingMethod === 'TIME' ? parseInt(totalMinutes, 10) : null}
                    />
```

- [ ] **Step 9: Start the frontend and verify the strip appears**

In a terminal: `cd client && npm run dev`

Open `http://localhost:5173`. Confirm:
- The "Billing Method" strip appears between the note section and the code selection card
- Clicking "Time-Based" reveals patient type buttons and the minutes input
- Typing `45` in the minutes field with "New Patient" selected shows `→ 99204 auto-selected` and checks 99204 in the CPT list
- Typing `80` shows `→ 99205 + 99417 auto-selected`
- Switching back to "MDM-Based" clears the auto-selected codes

- [ ] **Step 10: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: wire BillingMethodSelector into App state and analyze API call"
```

---

## Task 6: Update AnalysisReport.jsx and EMLevelCard.jsx

**Files:**
- Modify: `client/src/components/AnalysisReport.jsx`
- Modify: `client/src/components/EMLevelCard.jsx`

- [ ] **Step 1: Forward totalMinutes through AnalysisReport**

Open `client/src/components/AnalysisReport.jsx`. Find the component's prop destructuring at the top (it currently accepts `report`, `note`, `selectedCptCodes`, `selectedPayer`). Add `totalMinutes`:

```js
export default function AnalysisReport({ report, note, selectedCptCodes, selectedPayer, totalMinutes }) {
```

Then find the `EMLevelCard` call (around line 314–318):

```jsx
            <EMLevelCard
              emLevelRecommendation={report.emLevelRecommendation}
              selectedCptCodes={selectedCptCodes}
              isCoderReview={report.isCoderReview}
            />
```

Replace it with:

```jsx
            <EMLevelCard
              emLevelRecommendation={report.emLevelRecommendation}
              selectedCptCodes={selectedCptCodes}
              isCoderReview={report.isCoderReview}
              totalMinutes={totalMinutes}
            />
```

- [ ] **Step 2: Add the time summary panel to EMLevelCard**

Open `client/src/components/EMLevelCard.jsx`. Find the component signature at line 1:

```js
export default function EMLevelCard({ emLevelRecommendation, selectedCptCodes, isCoderReview }) {
```

Replace it with:

```js
export default function EMLevelCard({ emLevelRecommendation, selectedCptCodes, isCoderReview, totalMinutes }) {
```

Then find the MDM Details block (around line 121–137):

```jsx
      {/* MDM Details */}
      {mdmDetails && methodology === 'MDM' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          ...
        </div>
      )}
```

Add a time summary panel directly before that block:

```jsx
      {/* Time-Based Summary */}
      {methodology === 'TIME' && totalMinutes && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-[#F5EFE0]/60 dark:bg-instrument-bg-raised/60 border border-[#D6C9A8]/50 dark:border-instrument-border/50">
          <svg className="w-4 h-4 text-healthcare-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold font-mono text-slate-800 dark:text-white">{totalMinutes} min</span> total time declared on date of encounter
          </span>
        </div>
      )}

      {/* MDM Details */}
      {mdmDetails && methodology === 'MDM' && (
```

- [ ] **Step 3: End-to-end verification in the browser**

Make sure both the frontend (`cd client && npm run dev`) and backend (`cd server && npm run dev`) are running.

1. Paste any sample note into the Clinical Note box
2. Set Billing Method to **Time-Based**, patient type **New Patient**, minutes **45**
3. Confirm 99204 is auto-checked in CPT codes
4. Add an ICD-10 code (e.g. M54.5)
5. Click Analyze
6. In the report, confirm:
   - The E/M Level card says "Based on time-based evaluation"
   - The "45 min total time declared on date of encounter" panel is visible
   - The MDM grid (Problems / Data / Risk) is NOT shown
   - The gap analysis flags missing time documentation (since sample notes don't have it)

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AnalysisReport.jsx client/src/components/EMLevelCard.jsx
git commit -m "feat: show time summary in EMLevelCard when methodology is TIME"
```

---

## Task 7: Push branch

- [ ] **Step 1: Push feat/billing-for-time to GitHub**

```bash
git push -u origin feat/billing-for-time
```

- [ ] **Step 2: Confirm on GitHub**

Open `https://github.com/aabdur1/docdefend-mvp/tree/feat/billing-for-time` and confirm all commits are present. Do NOT open a PR — leave on branch for UI review.
