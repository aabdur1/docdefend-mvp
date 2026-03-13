# Accessibility, Security & Performance Fixes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical/high accessibility, security, and performance issues identified in the frontend audit.

**Architecture:** Targeted edits across existing components — no new files except a shared PillIcon component. All changes are backward-compatible.

**Tech Stack:** React 18, Tailwind CSS, Vite

---

### Task 1: Add ARIA live region to Toast container

**Files:**
- Modify: `client/src/components/Toast.jsx:146`

**Step 1: Add role and aria-live to toast container div**

Change the toast container div to include `role="status" aria-live="polite" aria-atomic="true"`.

---

### Task 2: Fix file input accessibility in FileUploader

**Files:**
- Modify: `client/src/components/FileUploader.jsx:84-110`

**Step 1: Add aria-label to the clickable drop zone and the hidden file input**

Add `role="button"` and `aria-label="Upload clinical note file. Drag and drop or click to browse."` to the drop zone div. Add `aria-label="Select clinical note file"` to the hidden input.

---

### Task 3: Fix textarea label association in NoteSelector

**Files:**
- Modify: `client/src/components/NoteSelector.jsx:184-204`

**Step 1: Add htmlFor to label and id to textarea**

Add `htmlFor="clinical-note-textarea"` to the label element and `id="clinical-note-textarea"` to the textarea.

---

### Task 4: Add section landmarks to App main content

**Files:**
- Modify: `client/src/App.jsx:360-570`

**Step 1: Wrap left column in section with aria-label, wrap right column similarly**

Add `aria-label="Analysis inputs"` to left column wrapper, `aria-label="Analysis results"` to right column wrapper.

---

### Task 5: Fix color contrast — replace text-slate-500 with text-slate-600

**Files:**
- Modify: Multiple components where `text-slate-500` is used for functional content (not dark mode variants which are fine)

**Step 1: Audit and fix contrast in light mode only**

Change `text-slate-500` to `text-slate-600` for functional text content in light mode. Keep `dark:text-slate-400` as-is. Key locations: App.jsx description text, NoteSelector helper text, LoadingSpinner text.

---

### Task 6: Add aria-label to icon-only status indicators in Header

**Files:**
- Modify: `client/src/components/Header.jsx:89-108`

**Step 1: Add aria-label to status dot container**

Add `aria-label={statusLabel}` to the mobile-only status dot div.

---

### Task 7: Add focus-within ring to CodeSelector checkboxes

**Files:**
- Modify: `client/src/components/CodeSelector.jsx:50`

**Step 1: Add focus-within styles to label wrapper**

Add `focus-within:ring-2 focus-within:ring-healthcare-500 focus-within:rounded-lg` to the label className.

---

### Task 8: Add Content Security Policy to index.html

**Files:**
- Modify: `client/index.html:4`

**Step 1: Add CSP meta tag**

Add a `<meta http-equiv="Content-Security-Policy">` tag allowing self, Google Fonts, and unsafe-inline for styles.

---

### Task 9: Add localStorage expiration for API key

**Files:**
- Modify: `client/src/context/ApiKeyContext.jsx:8-19`

**Step 1: Add 7-day expiration check on API key load**

Store API key with timestamp. On load, check if older than 7 days and clear if so.

---

### Task 10: Suppress console.error in production (ErrorBoundary)

**Files:**
- Modify: `client/src/App.jsx:187-188`

**Step 1: Only log full errors in development**

Wrap `console.error` with `import.meta.env.DEV` check.

---

### Task 11: Add client-side file size validation to FileUploader

**Files:**
- Modify: `client/src/components/FileUploader.jsx:39-76`

**Step 1: Check file size before upload**

Add a 10MB check at the start of `handleFile()`, set error if exceeded.

---

### Task 12: Debounce analyze button

**Files:**
- Modify: `client/src/App.jsx:264`

**Step 1: Track last submission time, prevent rapid re-clicks**

The button is already disabled while `loading` is true. This is sufficient — no additional change needed since `setLoading(true)` is called immediately in handleAnalyze.

---

### Task 13: Extract shared PillIcon component (performance)

**Files:**
- Create: `client/src/components/PillIcon.jsx`
- Modify: `client/src/App.jsx` (LoadingSpinner, footer)
- Modify: `client/src/components/Header.jsx`

**Step 1: Create PillIcon component with size/rotate/animate props**

Extract the SVG pill to a reusable component using a single set of gradient IDs with React `useId()`.

**Step 2: Replace inline SVGs in Header, Footer, and LoadingSpinner**

---

### Task 14: Lazy load Dashboard and TemplateLibrary (performance)

**Files:**
- Modify: `client/src/App.jsx:8,11`

**Step 1: Convert imports to React.lazy with Suspense**

Use `React.lazy()` for Dashboard and TemplateLibrary since they're modal content not needed at initial load.

---

### Task 15: Debounce resize handler in NoteSelector

**Files:**
- Modify: `client/src/components/NoteSelector.jsx:29-32`

**Step 1: Add debounce to resize listener**

Use a simple setTimeout-based debounce (300ms) for the resize event handler.

---

### Task 16: Add font-display: swap to Google Fonts load

**Files:**
- Modify: `client/index.html:10`

**Step 1: Verify display=swap is in Google Fonts URL**

The URL already includes `&display=swap`. No change needed — just verify.
