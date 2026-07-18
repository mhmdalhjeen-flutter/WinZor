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
          DEFAULT: "#1e3a8a",
          light: "#3b82f6",
          dark: "#172554",
        },
        rank: {
          bronze: "#cd7f32",
          silver: "#c0c0c0",
          gold: "#ffd700",
          platinum: "#e5e4e2",
        },
        bg: {
          soft: "#f9fafb",
          card: "#ffffff",
        }
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
        body: ["Tajawal", "sans-serif"],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(30, 58, 138, 0.08)',
        'premium': '0 10px 50px -12px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
