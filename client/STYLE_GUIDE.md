# DocDefend+ Style Guide

Comprehensive design system reference for the DocDefend+ clinical documentation QA platform.

---

## Color System

### Primary — Healthcare Green (British Racing Green)

Used for buttons, links, focus rings, and interactive elements.

| Token | Hex | Usage |
|-------|-----|-------|
| `healthcare-50` | `#f0fbf4` | Tinted backgrounds |
| `healthcare-100` | `#b7e4c7` | Light badges, hover states |
| `healthcare-200` | `#74c69d` | Borders on active elements |
| `healthcare-300` | `#40916c` | — |
| `healthcare-400` | `#2d6a4f` | Dark mode action text |
| `healthcare-500` | `#1B4332` | **Primary action color** (buttons, icons) |
| `healthcare-600` | `#0d3321` | Hover state for primary buttons |
| `healthcare-700` | `#081c11` | — |
| `healthcare-800` | `#040e08` | — |
| `healthcare-900` | `#020704` | Deep tint backgrounds |

### Trace Colors (EKG / Data Visualization)

Used for decorative EKG elements, dark mode accents, and data visualization.

| Token | Value | Usage |
|-------|-------|-------|
| `trace` | `#52B788` | Primary trace / dark mode accent |
| `trace-dim` | `#40916C` | Muted trace |
| `trace-glow` | `#74C69D` | Brightened trace / glow effects |
| `trace-faint` | `rgba(82, 183, 136, 0.08)` | Faint background tint |

### Light Mode — Parchment Palette

Warm, paper-like tones that evoke a clinical document feel.

| CSS Variable | Hex | Tailwind Equivalent | Usage |
|-------------|-----|---------------------|-------|
| `--color-bg` | `#FAF6EF` | `bg-[#FAF6EF]` | Page background |
| `--color-bg-raised` | `#F5EFE0` | `bg-[#F5EFE0]` | Cards, panels |
| `--color-bg-surface` | `#EDE6D3` | `bg-[#EDE6D3]` | Inputs, tabs, elevated surfaces |
| `--color-bg-hover` | `#E5DBBF` | `bg-[#E5DBBF]` | Hover states |
| `--color-border` | `#D6C9A8` | `border-[#D6C9A8]` | Card/panel borders |
| `--color-border-hover` | `#C4B48E` | `border-[#C4B48E]` | Interactive borders on hover |

### Dark Mode — Instrument Namespace

Cool navy/charcoal tones that evoke a medical instrument display.

| Token | Hex | Usage |
|-------|-----|-------|
| `instrument-bg` | `#0D0E12` | Page background |
| `instrument-bg-raised` | `#111827` | Cards, panels, modals |
| `instrument-bg-surface` | `#1A1D2E` | Inputs, selects, elevated surfaces |
| `instrument-bg-hover` | `#252A3A` | Hover states |
| `instrument-border` | `#1E2433` | Card/panel borders |
| `instrument-border-hover` | `#2D3548` | Interactive borders |
| `instrument-border-active` | `#2D6A4F` | Active/focus borders |
| `instrument-text` | `#e8ecf2` | Primary text |
| `instrument-text-muted` | `#8b95a8` | Secondary text |
| `instrument-text-faint` | `#4a5568` | Disabled/tertiary text |

### Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Danger | `#ef4444` | `#ef4444` | Errors, destructive actions |
| Warning | `#fb923c` | `#fb923c` | Cautions, medium risk |
| Success | `#2D6A4F` | `#2D6A4F` | Valid, high defensibility |
| Info | `#38bdf8` | `#38bdf8` | Informational |

### Payer Brand Colors (intentionally non-theme)

| Payer | Border | Background |
|-------|--------|------------|
| Medicare (CMS) | `border-blue-500` | `bg-blue-50` / `dark:bg-blue-900/20` |
| United Healthcare | `border-indigo-500` | `bg-indigo-50` / `dark:bg-indigo-900/20` |
| Aetna | `border-purple-500` | `bg-purple-50` / `dark:bg-purple-900/20` |
| BCBS | `border-sky-500` | `bg-sky-50` / `dark:bg-sky-900/20` |

---

## Typography

### Font Families

| Class | Family | Weight | Usage |
|-------|--------|--------|-------|
| `font-display` | DM Serif Display, Georgia, serif | 400 | Card titles, section headings, "DocDefend" |
| `font-body` | DM Sans, system-ui, sans-serif | 400–700 | Body text, UI labels, descriptions |
| `font-mono` | Share Tech Mono, Courier New, monospace | 400 | CPT/ICD codes, dollar amounts, scores, percentages |
| `font-clinical` | IBM Plex Mono, Courier New, monospace | 400–600 | Clinical note textarea |

### Size Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Metadata labels, badges, footnotes |
| `text-sm` | 14px | Body copy, descriptions, rationales |
| `text-base` | 16px | Button text, primary UI text |
| `text-lg` | 18px | Card section headings (with `font-display`) |
| `text-xl` | 20px | Loading/empty state titles |
| `text-2xl` | 24px | Header "DocDefend+" title, stat card values |

### Accessibility Minimums

- **Never use** below 11px (`text-[11px]`) — reserved only for very small decorative labels
- **Functional content** (rationales, descriptions, details) must be `text-sm` (14px) or larger
- **Body text** contrast: `text-slate-600 dark:text-slate-300` minimum for readable content
- **Muted text** contrast: `text-slate-500 dark:text-slate-400` minimum (passes WCAG AA at 4.5:1)
- **Never use** `text-slate-400 dark:text-slate-500` — fails WCAG AA contrast

---

## Component Patterns

### Cards

```
bg-[#F5EFE0] dark:bg-instrument-bg-raised
rounded-2xl
border border-[#D6C9A8] dark:border-instrument-border
p-4 sm:p-6
shadow-card
card-hover
```

Cards use `shadow-card` (multi-layer refined shadow) instead of Tailwind's `shadow-xl`. The `card-hover` class adds a subtle lift on hover.

### Buttons

**Primary Action** (Analyze):
```
bg-healthcare-500 hover:bg-healthcare-600 text-white
py-3 px-6 rounded-xl font-medium text-base
shadow-lg shadow-healthcare-500/30
hover:shadow-xl hover:shadow-healthcare-500/40
btn-ready-glow (when canAnalyze is true)
```

**Secondary/Nav** (Header buttons):
```
px-3 py-2 rounded-xl text-sm font-medium border
bg-[#EDE6D3] text-slate-700 border-[#C4B48E]
hover:bg-[#E5DBBF]
dark:bg-instrument-bg-surface dark:text-instrument-text dark:border-instrument-border
btn-lift
```

**Tertiary** (Templates, suggestions):
```
bg-healthcare-50 dark:bg-healthcare-900/30
text-healthcare-600 dark:text-trace-glow
rounded-xl border border-healthcare-200/50
btn-lift
```

**Destructive/Clear links:**
```
text-xs text-slate-500 dark:text-slate-400
hover:text-red-500 dark:hover:text-red-400
transition-colors
```

### Badges / Pills

**Code pills** (CPT = blue, ICD-10 = emerald):
```
px-2.5 py-1 text-xs font-mono font-semibold rounded-lg
bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300
border border-blue-200/50 dark:border-blue-800/30
```

**Status badges** (HIGH/MEDIUM/LOW):
```
px-2.5 py-1 rounded-full text-xs font-medium font-mono
```
- HIGH: `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`
- MEDIUM: `bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`
- LOW: `bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`

**Count badges:**
```
text-xs font-mono px-2 py-0.5 rounded-full
bg-[#F5EFE0] dark:bg-instrument-bg-raised
text-slate-500 dark:text-slate-400
```

### Inputs

**Text input / Select:**
```
px-4 py-3 border border-[#D6C9A8] dark:border-instrument-border
rounded-xl
focus:ring-2 focus:ring-healthcare-500 focus:border-healthcare-500
bg-[#F5EFE0] dark:bg-instrument-bg-surface dark:text-white
shadow-sm transition-shadow duration-200
```

**Textarea** (wrapped in `focus-glow-wrap`):
```
font-clinical text-sm
bg-[#F5EFE0] dark:bg-instrument-bg-surface
```

**Checkbox:**
```
rounded border-[#D6C9A8] dark:border-instrument-border
text-healthcare-600 focus:ring-healthcare-500
dark:bg-instrument-bg-surface
```

### Icon Badges (card headers)

```
w-10 h-10 rounded-xl
bg-healthcare-500
flex items-center justify-center
text-white
shadow-lg shadow-healthcare-500/30
```

### Section Headings (inside cards)

```
text-lg font-semibold font-display text-slate-800 dark:text-white
```

With subtitle:
```
text-xs text-slate-500 dark:text-slate-400
```

---

## Animations & Interactions

### Entry Animations

| Class | Duration | Effect |
|-------|----------|--------|
| `animate-fadeIn` | 0.4s | Fade in + slide up 10px |
| `animate-fadeInUp` | 0.5s | Fade in + slide up 20px |
| `animate-fadeInDown` | 0.5s | Fade in + slide down 20px |
| `animate-slideInRight` | 0.4s | Fade in + slide from right 20px |
| `animate-slideInLeft` | 0.4s | Fade in + slide from left 20px |
| `animate-scaleIn` | 0.3s | Fade in + scale from 95% |

### Stagger Classes

Apply to sequential siblings for cascading entry:
```
stagger-1  →  animation-delay: 0.1s
stagger-2  →  animation-delay: 0.2s
stagger-3  →  animation-delay: 0.3s
stagger-4  →  animation-delay: 0.4s
stagger-5  →  animation-delay: 0.5s
```

All stagger classes set `opacity: 0` initially — the animation fills it to 1.

### Interactive Effects

| Class | Effect |
|-------|--------|
| `btn-lift` | Hover: translateY(-1px); Active: translateY(0) |
| `btn-ready-glow` | Pulsing green glow on analyze button when ready |
| `card-hover` | Hover: translateY(-2px) + enhanced shadow |
| `check-pop` | Scale 1→1.15→1 bounce on checkbox toggle |
| `focus-glow-wrap` | Ambient radial glow around textarea on focus |

### Loading Animations

| Class | Effect |
|-------|--------|
| `animate-rotatePill` | 360deg rotation, 2s loop |
| `ekg-line` | Animated SVG stroke draw, 3s loop |
| `shimmer` | Left-to-right highlight sweep, 1.5s loop |
| `loading-dots` | Animated "..." text, 1.5s loop |
| `vitals-pulse` | Gentle scale 1→1.05→1, 2s loop |

### Score Ring

SVG circular progress with CSS-driven stroke animation:
- Track: `.score-ring-track` (static bg stroke)
- Fill: `.score-ring-fill` (animated stroke-dashoffset, 1.2s)
- Container: `.score-ring-container` (fade-in + scale, 0.5s)
- CSS vars: `--ring-circumference`, `--ring-offset`

### Toast System

- Enter: `toast-enter` (slide from right, 0.3s)
- Exit: `toast-exit` (slide to right, 0.3s)
- Countdown: `toast-countdown` bar (scaleX 1→0, duration matches toast)

---

## CSS Utilities

### Backgrounds

| Class | Description |
|-------|-------------|
| `bg-gradient-mesh` | Layered radial gradients using healthcare/trace colors |
| `grain-texture` | Subtle SVG noise overlay via `::after` pseudo-element |
| `medical-pattern` | Dot-grid pattern using radial-gradient |
| `glass` | Frosted glass effect (background blur + transparency) |

### Shadows

| Class | Description |
|-------|-------------|
| `shadow-card` | Multi-layer refined shadow (3 layers, responsive to hover) |
| `shadow-card:hover` | Elevated version with wider spread |

In dark mode, `shadow-card` uses higher-contrast values automatically.

### Scrolling

| Class | Description |
|-------|-------------|
| `scroll-fade` | Sticky gradient fades at top/bottom of scrollable containers |

### Print

| Class | Description |
|-------|-------------|
| `no-print` | Hidden when printing |
| `print-friendly` | Optimized for print (no shadows, forced borders) |

---

## Dark Mode Strategy

Dark mode uses Tailwind's `class` strategy — toggled by adding/removing `dark` on `<html>`.

### Pattern for dark mode classes:

```
Light background      →  dark:bg-instrument-bg-raised
Light surface         →  dark:bg-instrument-bg-surface
Light border          →  dark:border-instrument-border
Light text (primary)  →  dark:text-white
Light text (muted)    →  dark:text-slate-400
Light text (faint)    →  dark:text-slate-500
```

### Smooth transition

All elements have a 300ms transition on `background-color`, `border-color`, and `box-shadow` for smooth dark mode toggling. Animations and SVGs are excluded.

---

## Spacing Patterns

### Responsive padding

- Cards: `p-4 sm:p-6`
- Modals: `p-4 sm:p-6`
- Sections within cards: `p-3` or `p-5`
- Inline badges: `px-2.5 py-1`

### Responsive layout

- Two-column desktop: `grid lg:grid-cols-2 gap-6 lg:gap-8`
- Stacking on mobile: `flex-col sm:flex-row`
- Max content width: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

---

## ARIA & Accessibility

### Required patterns

- All icon-only buttons must have `aria-label`
- Tab-like interfaces use `role="tablist"` on container, `role="tab"` + `aria-selected` on items
- Toggle buttons use `aria-pressed`
- Form inputs have associated `<label>` elements or `aria-label`

### Color contrast requirements

- Primary text: minimum `text-slate-600 dark:text-slate-300` (~5.5:1)
- Secondary text: minimum `text-slate-500 dark:text-slate-400` (~4.5:1)
- Never use `text-slate-400` in light mode for text content (fails WCAG AA)
- Status colors on colored backgrounds maintain 4.5:1+ contrast

### Focus indicators

All interactive elements use `focus:ring-2 focus:ring-healthcare-500` with appropriate `ring-offset` for the background color.

---

## File Reference

| File | Purpose |
|------|---------|
| `tailwind.config.js` | Color tokens, font families, dark mode config |
| `src/index.css` | CSS custom properties, keyframes, utility classes, print styles |
| `index.html` | Google Fonts imports (DM Serif Display, DM Sans, Share Tech Mono, IBM Plex Mono) |
