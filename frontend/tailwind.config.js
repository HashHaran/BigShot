/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      'white': '#ffffff',
      'purple': '#3f3cbb',
      'midnight': '#121063',
      'metal': '#565584',
      'tahiti': '#3ab7bf',
      'silver': '#ecebff',
      'bubble-gum': '#ff77e9',
      'bermuda': '#78dcca',
      //'black' : '#000000',
      'violet': '#8b5cf6',
      'light-blue': '#60a5fa',
      'fuchsia': '#d946ef',
      'gray' : '#6b7280',
      'blue': '#2563eb',
      'red': '#ef4444'


    },
    extend: {},
  },
  plugins: [],
};
