# Billing for Time — Feature Design Spec

**Date:** 2026-05-06
**Requested by:** Dr. Caruso
**Status:** Approved, ready for implementation

---

## Background

DocDefend+ currently supports only MDM-based E/M billing analysis. Under CMS 2021+ guidelines, providers may alternatively select their E/M level based on **total time spent on the date of the encounter** rather than Medical Decision Making complexity. This is especially valuable for first visits with new, often older patients — visits that are long and thorough but may not score high on MDM criteria (data reviewed, orders placed, risk level) because the bulk of time is spent on history-taking, counseling, and care coordination.

Dr. Caruso flagged this gap on 2026-04-16 (noted in CLAUDE.md). This spec defines the full implementation.

---

## CMS Time-Based E/M Rules (2025)

Time counts toward billing only when:
- It is the **qualified provider's time** (not MA, not staff)
- It occurs **on the same calendar day** as the encounter
- Included activities: reviewing records, taking history, performing exam, counseling, ordering tests/medications, documenting the EHR, coordinating care

**Time thresholds for office/outpatient visits:**

| Code | New Patient | Established Patient |
|------|-------------|---------------------|
| 99202 / 99212 | 15–29 min | 10–19 min |
| 99203 / 99213 | 30–44 min | 20–29 min |
| 99204 / 99214 | 45–59 min | 30–39 min |
| 99205 / 99215 | 60–74 min | 40–54 min |
| 99205 + 99417 | 75–89 min | — |
| 99215 + 99417 | — | 55–69 min |
| +1× 99417 per add'l 15 min | 90+ min | 70+ min |

**Documentation the note must contain to survive audit:**
1. A total time statement: *"Total time spent on date of encounter: 45 minutes"*
2. A statement that time was used to select the E/M level
3. A list of activities included in that time
4. Time must be re-entered per encounter — copied-forward time statements are an audit red flag

---

## Chosen Approach

**Toggle + minutes input (Option A).** A compact "Billing Method" strip is inserted as its own row between the Note section and the Code section in the main form. When Time-Based is active, the doctor enters minutes and selects patient type; the system auto-maps to the correct E/M code and pre-selects it in the CPT list. The full analysis then validates time documentation instead of MDM criteria.

---

## UI Design

### Billing Method Strip

A new row between `NoteSelector` and `CodeSelector`:

- Two pill buttons: **MDM-Based** (default, selected) and **Time-Based**
- Uses the existing sliding indicator pattern from `NoteSelector` tabs
- When **Time-Based** is selected, the strip expands inline to show:
  - Patient type toggle: **New Patient** / **Established Patient** (default: New Patient)
  - Minutes input: number field, labeled "Total time on date of encounter", placeholder "e.g. 45"
  - Auto-mapped code hint: *"→ 99204 auto-selected"* shown in muted text as the doctor types
- When switching back to MDM-Based, the time inputs disappear and the auto-selected E/M code is deselected

### Code Selection Behavior

- Time-based logic only controls the E/M code slot (99202–99215 + 99417)
- Procedure codes (injections, fluoroscopy, etc.) remain freely selectable in both modes
- If minutes qualify for prolonged services (≥75 min new patient, ≥55 min established), **99417** is also auto-added to the CPT list, once per qualifying 15-minute block
- Any previously manually selected E/M code is deselected when time-based auto-selection fires

### Validation

- If `billingMethod === "TIME"` and `totalMinutes` is empty on submit, show an inline error on the minutes field — block form submission
- `totalMinutes` must be a positive integer between 1 and 300
- Patient type defaults to "New Patient" so it is never unset

---

## Data Flow

### Frontend State (App.jsx)

Three new state values:
```js
const [billingMethod, setBillingMethod] = useState('MDM'); // 'MDM' | 'TIME'
const [totalMinutes, setTotalMinutes] = useState('');
const [patientType, setPatientType] = useState('new'); // 'new' | 'established'
```

These are passed down to the billing strip component and included in the `/api/analyze` request body.

### New Component: BillingMethodSelector.jsx

Owns the toggle, patient type, and minutes input UI. Receives:
- `billingMethod`, `onBillingMethodChange`
- `totalMinutes`, `onTotalMinutesChange`
- `patientType`, `onPatientTypeChange`
- `onCodeAutoSelect` — callback fired when minutes map to an E/M code, so CodeSelector can update its selection

Contains a local `TIME_THRESHOLDS` lookup table (the CMS table above) that maps `(minutes, patientType)` → CPT code + optional 99417.

### API Request

`/api/analyze` body gains two optional fields:
```json
{
  "note": "...",
  "cptCodes": ["99204"],
  "icd10Codes": ["M54.5"],
  "payerId": "medicare",
  "billingMethod": "TIME",
  "totalMinutes": 45
}
```

Server validation: `billingMethod` must be `"MDM"` or `"TIME"` (defaults to `"MDM"` if absent); `totalMinutes` must be a positive integer ≤ 300 when `billingMethod === "TIME"`.

### Backend Changes

**`server/index.js`** — destructure and validate `billingMethod` and `totalMinutes` from request body; pass both to `buildSystemPrompt()` and `buildUserPrompt()`.

**`server/prompt.js`**

`buildSystemPrompt(payerId, billingMethod)` — when `billingMethod === "TIME"`, appends a time-billing instruction block that replaces MDM evaluation criteria:
- Evaluate whether total time is documented with an explicit statement
- Check that activities contributing to time are listed
- Flag if the time statement appears copied-forward (boilerplate)
- Check that the note states time was used to select the E/M level

`buildUserPrompt(note, cptCodes, icd10Codes, payerId, billingMethod, totalMinutes)` — when TIME, appends:
> *"BILLING METHOD: Time-Based. Total time on date of encounter: 45 minutes. The provider is billing 99204 based on time, not MDM. Evaluate whether the documentation supports time-based billing."*

**`client/src/data/reimbursementRates.js`** — add:
```js
'99417': { rate: 40, description: 'Prolonged office visit, each additional 15 min' }
```

### Claude Response

No schema changes required. The existing `emLevelRecommendation` field already has `methodology: "MDM" | "TIME"`. Claude will populate it as `"TIME"` and shift its gap analysis to time documentation criteria. The `mdmDetails` sub-object will be null when methodology is TIME.

---

## Analysis Report Changes

**`EMLevelCard`** — `methodology` field is already rendered. When TIME:
- Hide the MDM breakdown (problem complexity / data complexity / risk level)
- Show: time entered, time threshold met, mapped code

**`AnalysisReport` gap analysis** — Claude's `missingElements` and `fixSuggestions` for the E/M code will surface time-specific gaps:
- Missing total time statement
- No declaration that time was used to select the level
- Activities not enumerated
- Possible copied-forward time (audit red flag)

**`FinancialImpact`** — no changes needed; rates look up by CPT code as today.

---

## Files Touched

| File | Change |
|------|--------|
| `client/src/components/BillingMethodSelector.jsx` | New component |
| `client/src/App.jsx` | Add 3 state values; pass to billing strip; include in API call |
| `client/src/components/CodeSelector.jsx` | Accept auto-select callback; deselect conflicting E/M on mode switch |
| `client/src/components/EMLevelCard.jsx` | Hide MDM breakdown when methodology is TIME |
| `client/src/data/reimbursementRates.js` | Add 99417 |
| `server/index.js` | Destructure + validate billingMethod / totalMinutes |
| `server/prompt.js` | Update buildSystemPrompt + buildUserPrompt signatures |

---

## Out of Scope

- Recording upload for time extraction (deferred)
- Saving billing method preference between sessions
- Batch analysis time-based support (MDM only for batch, for now)
