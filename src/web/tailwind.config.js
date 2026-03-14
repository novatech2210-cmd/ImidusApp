/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'imidus-blue': 'var(--imidus-blue)',
        'imidus-blue-dark': 'var(--imidus-blue-dark)',
        'imidus-gold': 'var(--imidus-gold)',
        'imidus-dark': 'var(--imidus-dark)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-white': 'var(--text-white)',
        'text-gold': 'var(--text-gold)',
        'surface-app': 'var(--surface-app)',
        'surface-card': 'var(--surface-card)',
        'surface-modal': 'var(--surface-modal)',
      },
      backgroundImage: {
        'imidus-blue-gradient': 'var(--imidus-blue-gradient)',
      },
      boxShadow: {
        'elevation-1': 'var(--elevation-1-shadow)',
        'elevation-1-hover': 'var(--elevation-1-shadow-hover)',
        'elevation-2': 'var(--elevation-2-shadow)',
        'elevation-3': 'var(--elevation-3-shadow)',
        'elevation-3-hover': 'var(--elevation-3-shadow-hover)',
      },
      fontFamily: {
        primary: 'var(--font-primary)',
        mono: 'var(--font-mono)',
        display: 'var(--font-display)',
      },
    },
  },
  plugins: [],
};
