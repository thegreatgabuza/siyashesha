/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand palette from the Siyashesha logo: navy #0B2559, red #DC1F26.
        ink: {
          DEFAULT: '#0B2559',
          soft: '#2A3B5C',
          muted: '#5B6478',
        },
        brand: {
          50: '#F4F6FB',
          100: '#E6EBF4',
          200: '#C5D0E3',
          300: '#8FA0C2',
          400: '#3F5A8A',
          500: '#0B2559',
          600: '#091F4A',
          700: '#071739',
        },
        emergency: {
          50: '#FDECEC',
          100: '#FBD5D5',
          500: '#DC1F26',
          600: '#B3181E',
        },
        success: {
          50: '#E9F7EE',
          100: '#D1F0DD',
          500: '#16A34A',
          600: '#15803D',
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
        display: ['BebasNeue_400Regular'],
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
