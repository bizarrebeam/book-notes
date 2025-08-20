/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.js",
    "./views/**/*.{html,js,ejs}"
  ],
  theme: {
    extend: {
      screens: {
        'lg-custom': '840px',
        'tall': { 'raw': '(min-height: 800px)' },
        'x-tall': { 'raw': '(min-height: 900px)' },
      },
      fontFamily: {
        'lexend': ["Lexend", "sans-serif"], 
      },
      letterSpacing: {
        'tight-custom': '-0.04em', 
      },
      colors: {
        'brown-1': '#463F3A',
        'brown-2': '#9F9F92', 
        'brown-3': '#F4F1EA',
        'peach': '#E0AFA0',
        'white': '#FFFFFF'
      },
      boxShadow: {
        'text': '2px 2px 4px rgba(0, 0, 0, 0.5)', 
      },
      fontSize: {
        'xxxs': '0.5rem',
        'xxs': '0.625rem'
      }
    },
  },
  plugins: [],
}
