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
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          bright: 'rgb(var(--color-primary-bright) / <alpha-value>)',
          soft: 'rgb(var(--color-primary-soft) / <alpha-value>)',
        },
        background: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border-color) / <alpha-value>)',
          subtle: 'rgb(var(--border-subtle) / <alpha-value>)',
        },
        input: {
          bg: 'rgb(var(--input-bg) / <alpha-value>)',
        },
        hover: {
          bg: 'rgb(var(--hover-bg) / <alpha-value>)',
        },
        status: {
          success: 'rgb(var(--color-success) / <alpha-value>)',
          hot: 'rgb(var(--color-hot) / <alpha-value>)',
          warm: 'rgb(var(--color-warm) / <alpha-value>)',
          cold: 'rgb(var(--color-cold) / <alpha-value>)',
          uncertain: 'rgb(var(--color-uncertain) / <alpha-value>)',
        },
        chart: {
          grid: 'rgb(var(--chart-grid) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'card-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.20)',
        'card-light': '0 4px 6px -1px rgba(70, 50, 30, 0.06), 0 2px 4px -1px rgba(70, 50, 30, 0.04)',
      },
      backgroundImage: {
        'wave-pattern': 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'smallGrid\' width=\'8\' height=\'8\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 8 0 L 0 0 0 8\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'0.1\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23smallGrid)\' /%3E%3C/svg%3E")',
      }
    },
  },
  plugins: [],
}
