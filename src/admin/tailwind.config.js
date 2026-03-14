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
          blue: '#1E5AA8',
          gold: '#D4AF37',
        },
        surface: {
          'app-bg': '#F5F5F5',
          'card-bg': '#FFFFFF',
        },
        text: {
          dark: '#1A202C',
          light: '#FFFFFF',
        },
        status: {
          success: '#2E7D32',
          warning: '#E65100',
          info: '#1565C0',
          danger: '#C62828',
        },
        chart: {
          revenue: '#1E5AA8',
          loyalty: '#D4AF37',
        }
      },
      backgroundImage: {
        'blue-gradient': 'linear-gradient(135deg, #1E5AA8 0%, #174785 100%)',
      },
      boxShadow: {
        'l1': '0 4px 12px rgba(30,90,168,0.08)',
        'l2': '0 8px 24px rgba(30,90,168,0.16)',
        'l3': '0 10px 20px rgba(30,90,168,0.25)',
        'gold-btn': '0 4px 14px rgba(212, 175, 55, 0.25)',
      },
      letterSpacing: {
        'heading': '0.3px',
      },
      fontSize: {
        'price': '1.1em', // Relative to parent
      },
      textShadow: {
        'loyalty': '0 2px 8px rgba(212,175,55,0.25)',
      },
      fontFamily: {
        'wordmark': ['Georgia', 'serif'],
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.text-shadow-loyalty': {
          'text-shadow': '0 2px 8px rgba(212,175,55,0.25)',
        },
      })
    }
  ],
};
