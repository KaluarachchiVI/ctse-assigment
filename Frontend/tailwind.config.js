/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        background: 'var(--bg-color)',
        foreground: 'var(--text-main)',
        muted: 'var(--text-muted)',
        card: 'var(--surface)',
        black: 'var(--black)',
        primary: 'var(--primary)',
      },
    },
  },
  plugins: [],
};
