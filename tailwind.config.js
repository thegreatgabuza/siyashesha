/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B1E40',
          soft: '#2A3B5C',
          muted: '#5B6B8A',
        },
        lavender: {
          50: '#F6F4FD',
          100: '#ECE8FB',
          200: '#DCD5F7',
          300: '#C3B6F0',
          400: '#A58FE6',
        },
        skyglass: {
          50: '#F2F7FE',
          100: '#E3EEFC',
          200: '#CFE2FA',
          300: '#AECBF2',
        },
        brand: {
          400: '#8471D9',
          500: '#6D5BD0',
          600: '#5944B8',
          700: '#473998',
        },
        emergency: {
          50: '#FDECEC',
          100: '#FBD5D5',
          500: '#DC2626',
          600: '#B91C1C',
        },
        success: {
          50: '#E7F7F3',
          100: '#CFEFE7',
          500: '#0D9488',
          600: '#0B7A70',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F4F9',
          200: '#E3E8F0',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#121A2E',
        },
        canvasdark: {
          DEFAULT: '#0B1024',
          card: '#17203A',
        },
      },
      borderRadius: {
        xl2: '20px',
        xl3: '24px',
        xl4: '28px',
      },
      fontFamily: {
        serif: ['InstrumentSerif_400Regular'],
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
