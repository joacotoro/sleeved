/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vault: {
          black:  "#0c0a07",
          darker: "#111009",
          dark:   "#18140e",
          card:   "#221d15",
          raised: "#2c2618",
          border: "#504535",
          "border-light": "#6a5a42",
          gold:        "#d4ad60",
          "gold-light": "#eac878",
          "gold-dim":   "#8a7040",
          cream:  "#f2e8d4",
          muted:  "#b09878",
          faint:  "#706050",
        },
      },
      fontFamily: {
        cinzel: ["Cinzel", "serif"],
        body:   ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400% center" },
          "100%": { backgroundPosition: "400% center" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        "fade-in": "fade-in 0.3s ease-out both",
        shimmer:   "shimmer 4s linear infinite",
      },
    },
  },
  plugins: [],
};
