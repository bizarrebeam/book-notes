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
        'inter': ["Inter", "sans-serif"], 
      },
    },
  },
  plugins: [],
}

