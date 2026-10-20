/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Golos Text"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Unbounded"', '"Golos Text"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        page: 'var(--bg-page)',
        card: 'var(--bg-card)',
        surface: 'var(--bg-surface)',
        'surface-2': 'var(--bg-surface-2)',
        ink: 'var(--text-ink)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        line: 'var(--border-line)',
        'line-2': 'var(--border-line-2)',
        brand: {
          DEFAULT: 'var(--accent-brand)',
          hover: 'var(--accent-brand-hover)',
          tint: 'var(--accent-brand-tint)',
          line: 'var(--accent-brand-line)',
          ink: 'var(--accent-brand-ink)',
          50: '#e6f8ee',
          100: '#c2efd7',
          500: '#00b956',
          600: '#009e49',
          700: '#007a37',
        },
        clay: {
          DEFAULT: '#FF5A26',
          tint: '#FFF0EB',
        },
      },
      borderRadius: {
        '4xl': '28px',
      },
    },
  },
  plugins: [],
};
