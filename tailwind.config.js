/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ¡Crucial para habilitar el cambio de temas claro/oscuro!
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}