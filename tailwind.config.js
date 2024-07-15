/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.js",
    "./views/**/*.{html,js,ejs}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ["Poppins", "sans-serif"], 
      },
      boxShadow: {
        'text': '2px 2px 4px rgba(0, 0, 0, 0.5)', // Custom shadow for text
      },
      fontSize: {
        'xxxs': '0.5rem',
        'xxs': '0.625rem'
      }
    },
  },
  plugins: [],
}
