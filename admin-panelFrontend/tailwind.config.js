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
          DEFAULT: "#ef4444",
          hover: "#dc2626",
        },
        secondary: "#6366f1",
        dark: "#f1f5f9",
        card: "#ffffff",
        "border-color": "#e2e8f0",
        muted: "#64748b",
        main: "#0f172a",
        success: "#16a34a",
        warning: "#d97706",
        danger: "#ef4444",
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
