/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1e40af',
          secondary: '#0f172a',
          accent: '#3b82f6',
          danger: '#ef4444',
          success: '#22c55e',
          warning: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
