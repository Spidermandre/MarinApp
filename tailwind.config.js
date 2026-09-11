/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Sistema di design "Liquid Glass · FitExpress"
        giallo: {
          DEFAULT: '#FFD400', // base del marchio
          chiaro: '#FFE566',
          scuro: '#E0B900',
        },
        inchiostro: '#111111', // testo principale su giallo
        grafite: '#3A3730',
        notte: '#14130B', // fondo tema scuro
        lavoro: '#E4572E', // fase "LAVORO" degli intervalli
        recupero: '#1B998B', // fase "RECUPERO"
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        glass: '1.75rem',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(17,17,17,0.12), inset 0 1px 0 rgba(255,255,255,0.45)',
        'glass-dark': '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)',
      },
      keyframes: {
        'glass-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pulsegiallo: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'glass-in': 'glass-in 260ms cubic-bezier(0.32,0.72,0,1)',
        pulsegiallo: 'pulsegiallo 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
