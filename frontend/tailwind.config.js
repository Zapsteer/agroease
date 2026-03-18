/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          primary:  "#1B5E20",
          dark:     "#0a3d0a",
          medium:   "#2E7D32",
          light:    "#388E3C",
          soft:     "#4CAF50",
          pale:     "#E8F5E9",
          muted:    "#C8E6C9",
        },
        beige: {
          DEFAULT: "#F5F5DC",
          warm:    "#FFFDE7",
          light:   "#FFF8E1",
        },
      },
      fontFamily: {
        sans:    ["DM Sans", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};
