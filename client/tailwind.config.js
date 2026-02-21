/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        healthcare: {
          // Primary action scale — British Racing Green
          // In light mode, components use 500-700 for solid fills (buttons, badges).
          // In dark mode, override via `dark:text-healthcare-400` / `dark:bg-healthcare-500`.
          50:  '#f0fbf4',
          100: '#b7e4c7',
          200: '#74c69d',
          300: '#40916c',
          400: '#2d6a4f',
          500: '#1B4332',  // deep BRG — primary
          600: '#0d3321',
          700: '#081c11',
          800: '#040e08',
          900: '#020704',
        },
        // EKG trace — lighter green for readability on dark backgrounds
        trace: {
          DEFAULT: '#52B788',
          dim:     '#40916C',
          glow:    '#74C69D',
          faint:   'rgba(82, 183, 136, 0.08)',
        },
        instrument: {
          // Dark-mode backgrounds — cool slate/navy (used with dark: prefix)
          bg: {
            DEFAULT: '#0D0E12',
            raised:  '#111827',
            surface: '#1A1D2E',
            hover:   '#252A3A',
          },
          // Off-white text hierarchy
          text: {
            DEFAULT:  '#e8ecf2',
            muted:    '#8b95a8',
            faint:    '#4a5568',
          },
          // Borders and dividers — cool slate (dark mode)
          border: {
            DEFAULT: '#1E2433',
            hover:   '#2D3548',
            active:  '#2D6A4F',
          },
          // Accent sub-tokens
          accent: {
            DEFAULT: '#1B4332',
            dim:     '#0D3321',
            glow:    '#52B788',
            faint:   'rgba(27, 67, 50, 0.10)',
          },
          // Semantic status
          danger:  '#ef4444',
          warning: '#fb923c',
          success: '#2D6A4F',
          info:    '#38bdf8',
        },
      },
      fontFamily: {
        display:  ['"DM Serif Display"', 'Georgia', 'serif'],
        body:     ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:     ['"Share Tech Mono"', '"Courier New"', 'monospace'],
        clinical: ['"IBM Plex Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
};
