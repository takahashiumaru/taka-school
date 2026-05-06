/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#eef6ff",
          100: "#d9eaff",
          200: "#bcd9ff",
          300: "#8ebfff",
          400: "#5b9cff",
          500: "#3478f6",
          600: "#205bdb",
          700: "#1c49b1",
          800: "#1c3f8e",
          900: "#1c3870",
        },
        accent: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -15px rgba(28,72,177,0.25)",
      },
    },
  },
  plugins: [],
}
