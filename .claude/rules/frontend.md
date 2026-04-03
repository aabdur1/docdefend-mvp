When working on files in `client/`:

- Full design system: `client/STYLE_GUIDE.md` (colors, typography, animations, responsive breakpoints)
- `font-display` (DM Serif Display) for card titles only, `font-body` (DM Sans) for UI, `font-mono` (Share Tech Mono) for codes/amounts, `font-clinical` (IBM Plex Mono) for clinical text
- Payer brand colors: blue (Medicare), orange (UHC), purple (Aetna), sky (BCBS), teal (Cigna)
- Focus rings: `focus-visible:ring` on buttons (keyboard only), `focus:ring` on inputs (always)
- Dashboard and TemplateLibrary are lazy-loaded via `React.lazy()` + `Suspense`
- `PillIcon.jsx` uses `useId()` for unique SVG gradient IDs
- PDF export via `utils/generatePdfReport.js` (HTML Blob URL, not window.print)
- CSP meta tag in `index.html` allows self, Google Fonts, and Render backend
- PostCSS strips CSS `@import` statements. Use `<link>` tags in `index.html` for external fonts.
