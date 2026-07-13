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
          DEFAULT: "#b91c1c", // الأحمر الملكي
          light: "#ef4444",
          dark: "#7f1d1d",
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
        'glass': '0 8px 32px 0 rgba(185, 28, 28, 0.1)',
        'premium': '0 10px 50px -12px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
