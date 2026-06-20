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
        dark: "#0f172a",
        card: "#1e293b",
        "border-color": "#334155",
        muted: "#94a3b8",
        main: "#f8fafc",
        success: "#22c55e",
        warning: "#f59e0b",
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
