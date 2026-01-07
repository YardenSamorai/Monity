/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode
        light: {
          bg: '#FFFFFF',
          surface: '#F9FAFB',
          elevated: '#FFFFFF',
          border: '#E5E7EB',
          'border-light': '#F3F4F6',
          text: {
            primary: '#111827',
            secondary: '#6B7280',
            tertiary: '#9CA3AF',
          },
          accent: {
            DEFAULT: '#3B82F6',
            hover: '#2563EB',
            light: '#DBEAFE',
          },
          success: {
            DEFAULT: '#10B981',
            light: '#D1FAE5',
            dark: '#059669',
          },
          warning: {
            DEFAULT: '#F59E0B',
            light: '#FEF3C7',
            dark: '#D97706',
          },
          danger: {
            DEFAULT: '#EF4444',
            light: '#FEE2E2',
            dark: '#DC2626',
          },
        },
        // Dark mode
        dark: {
          bg: '#000000',
          surface: '#111111',
          elevated: '#1C1C1E',
          border: '#2C2C2E',
          'border-light': '#3A3A3C',
          text: {
            primary: '#FFFFFF',
            secondary: '#EBEBF5',
            tertiary: '#8E8E93',
          },
          accent: {
            DEFAULT: '#0A84FF',
            hover: '#409CFF',
            light: '#1C3A52',
          },
          success: {
            DEFAULT: '#30D158',
            light: '#1C3A2E',
            dark: '#32D74B',
          },
          warning: {
            DEFAULT: '#FF9F0A',
            light: '#3D2F1F',
            dark: '#FFB340',
          },
          danger: {
            DEFAULT: '#FF453A',
            light: '#3D1F1F',
            dark: '#FF6961',
          },
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      transitionDuration: {
        '250': '250ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Enable RTL support
    function ({ addVariant }) {
      addVariant('rtl', '[dir="rtl"] &')
    },
  ],
}
