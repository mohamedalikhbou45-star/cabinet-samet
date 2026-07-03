import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Vert émeraude façon Deloitte (#86BC25) décliné en nuancier.
        brand: {
          50: "#f4faea",
          100: "#e7f3ce",
          200: "#d1e8a2",
          300: "#b6db6d",
          400: "#9ccd44",
          500: "#86BC25",
          600: "#6ca015",
          700: "#527811",
          800: "#425f14",
          900: "#385016",
          950: "#1c2c07",
        },
        accent: {
          DEFAULT: "#86BC25",
          hover: "#78a821",
        },
        ink: {
          DEFAULT: "#0a0a0a",
          soft: "#1a1a1a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.9s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
