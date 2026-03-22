/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors - ALIGNED WITH MOBILE SPEC
        brand: {
          blue: '#0A1F3D',    /* Midnight Navy PRIMARY (was #1E5AA8) */
          gold: '#D4AF37',    /* Imperial Gold ACCENT */
        },
        // Imperial Onyx Dark Theme colors - UPDATED TO MOBILE SPEC
        onyx: {
          // Backgrounds
          'bg-primary': '#0F0F12',
          'bg-secondary': '#1A1A1F',
          'bg-tertiary': '#222228',
          'border': '#2A2A30',
          'border-hover': '#3A3A42',
          // Text
          'text-primary': '#F5F5F7',
          'text-secondary': '#9A9AA3',
          'text-muted': '#6E6E78',
          // Accent colors - UPDATED FOR MOBILE SPEC ALIGNMENT
          'blue': '#0A1F3D',          /* Midnight Navy PRIMARY (was #5BA0FF) */
          'blue-light': '#152E52',    /* Light navy (was #7AB8FF) */
          'blue-dark': '#051020',     /* Dark navy (was #3D82E0) */
          'gold': '#D4AF37',          /* Imperial Gold (was #FFD666) */
          'gold-dark': '#B08D26',     /* Dark gold (was #E5B84D) */
          'gold-light': '#E5C76B',    /* Light gold */
          'green': '#4ADE80',         /* Keep - not in main spec */
          'red': '#FF6B6B',           /* Keep - error color */
          'purple': '#A855F7',        /* Keep - accent variant */
        },
        // Legacy surface colors
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
          revenue: '#0A1F3D',    /* Updated to mobile spec navy */
          loyalty: '#D4AF37',    /* Already correct */
        }
      },
      backgroundImage: {
        'blue-gradient': 'linear-gradient(135deg, #0A1F3D 0%, #051020 100%)',      /* Updated to mobile spec */
        'onyx-blue-gradient': 'linear-gradient(135deg, #0A1F3D 0%, #051020 100%)', /* Updated to mobile spec */
        'onyx-gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #B08D26 100%)',  /* Updated to mobile spec */
      },
      boxShadow: {
        'l1': '0 4px 12px rgba(30,90,168,0.08)',
        'l2': '0 8px 24px rgba(30,90,168,0.16)',
        'l3': '0 10px 20px rgba(30,90,168,0.25)',
        'gold-btn': '0 4px 14px rgba(212, 175, 55, 0.25)',
        'onyx': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      letterSpacing: {
        'heading': '0.3px',
      },
      fontSize: {
        'price': '1.1em',
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
