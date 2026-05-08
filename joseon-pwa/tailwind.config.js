/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        joseon: {
          dark:   '#1A1208',
          brown:  '#2D1F0A',
          gold:   '#C9A84C',
          amber:  '#B45309',
          cream:  '#F5F1EB',
          muted:  '#9A8A72',
          border: '#E8E0D0',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', 'serif'],
        sans:  ['"Noto Sans KR"', 'sans-serif'],
      }
    }
  },
  plugins: []
}
