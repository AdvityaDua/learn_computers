/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#4c1d95',
          100: '#5b21b6',
          200: '#6d28d9',
          300: '#7c3aed',
          400: '#6d28d9',
          500: '#5b21b6',
          600: '#4c1d95',
          700: '#3a1254',
          800: '#2d1049',
          900: '#1f0e32'
        }
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.1)',
        'glow': '0 10px 30px rgba(76, 29, 149, 0.15)',
        'glow-lg': '0 15px 40px rgba(76, 29, 149, 0.2)'
      },
      spacing: {
        '0.5': '0.125rem',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '28px',
        '3xl': '32px',
      }
    },
  },
  plugins: [],
};
