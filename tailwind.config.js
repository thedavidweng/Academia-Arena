/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Epilogue', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        label: ['Space Grotesk', 'monospace'],
      },
      colors: {
        primary: '#aa301a',
        'primary-container': '#cb4830',
        'on-primary': '#fef9f1',
        surface: '#fef9f1',
        'surface-dim': '#f0ebe3',
        'surface-container-low': '#f8f3eb',
        'surface-container-lowest': '#ffffff',
        'surface-container-high': '#ece8e0',
        'on-surface': '#1d1c17',
        'outline-variant': '#e0bfb8',
        'secondary-container': '#e8e0d4',
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        full: '0px',
      },
    },
  },
  plugins: [],
};
