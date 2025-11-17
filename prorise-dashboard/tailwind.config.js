/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7dde4f',
        'primary-dark': '#5ab836',
        'primary-light': '#9ef06f',
        'gray-900': '#0f0f0f',
        'gray-800': '#1a1a1a',
        'gray-700': '#2a2a2a',
      },
      fontFamily: {
        satoshi: ['Satoshi', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
