/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          darkest: "#060a0f",
          dark:    "#0c1218",
          base:    "#111a24",
          card:    "#16202c",
          border:  "#1e2a38",
          muted:   "#5a6d7e",
          light:   "#8eb6c7",
          text:    "#e2ddd0",
          gold:    "#c4a265",
          goldLight: "#dbb978",
          red:     "#d44a4a",
        },
      },
      fontFamily: {
        sans:  ['system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
