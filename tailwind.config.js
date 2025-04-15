/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.{html,php,js}'
  ],
  darkMode: 'class', // Añadido explícitamente para asegurar que se use la estrategia de clase
  theme: {
    extend: {}
  },
  plugins: []
}
