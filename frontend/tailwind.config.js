/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf9",
          100: "#d7f8f1",
          200: "#b2f0e4",
          300: "#7be3d2",
          400: "#3fd0bc",
          500: "#1fb9a7",
          600: "#149586",
          700: "#14776d",
          800: "#155f58",
          900: "#164f4a",
        },
      },
      boxShadow: {
        card: "0 12px 25px rgba(22, 79, 74, 0.08)",
      },
    },
  },
  plugins: [],
};
