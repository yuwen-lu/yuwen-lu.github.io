/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
      },
      textColor: {
        primary: 'var(--color-text)',
        secondary: 'var(--color-text-secondary)',
        accent: 'var(--color-accent)',
        nav: 'var(--color-nav)',
      },
      backgroundColor: {
        page: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        button: 'var(--color-button)',
        'button-hover': 'var(--color-button-hover)',
      },
      borderColor: {
        rule: 'var(--color-rule)',
      },
    },
  },
  plugins: [],
}
