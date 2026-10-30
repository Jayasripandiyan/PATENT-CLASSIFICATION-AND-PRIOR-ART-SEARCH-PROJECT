/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#07111F",
        darkSecondary: "#0D1726",
        darkCard: "#111D2E",
        darkBorder: "#223149",
        cyanAccent: "#38BDF8",
        indigoAccent: "#6366F1",
        successGreen: "#22C55E",
        warningYellow: "#F59E0B",
        errorRed: "#EF4444",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Manrope', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
