/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wechat: {
          green: '#07C160',
          bg: '#EDEDED',
          bar: '#F7F7F7',
          border: '#E5E5E5',
          text: '#333333',
          gray: '#999999',
          dark: '#191919',
          // Dark mode colors
          darkBg: '#111111',
          darkBar: '#1A1A1A',
          darkBorder: '#333333',
          darkText: '#D9D9D9'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
