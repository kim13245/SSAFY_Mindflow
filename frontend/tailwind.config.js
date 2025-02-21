/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1E1E1E",
        secondary: "#252525",
        third: "#2C2C2C",
        fourth: "#303030",
      },
      animation: {
        "neon-shine": "shine 1.5s infinite",
      },
      keyframes: {
        shine: {
          "0%": { left: "-100%" },
          "100%": { left: "100%" },
        },
      },
      boxShadow: {
        neon: "0 0 2px #FFDB01, 0 0 4px #FFDB01, 0 0 8px #FFDB01",
      },
    },
  },
  plugins: [],
}
