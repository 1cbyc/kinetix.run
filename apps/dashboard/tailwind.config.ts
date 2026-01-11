import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Starlink-inspired dark theme
        background: {
          DEFAULT: "#000000",
          secondary: "#0a0a0a",
          tertiary: "#1a1a1a",
        },
        border: {
          DEFAULT: "#1f1f1f",
          light: "#2a2a2a",
        },
        foreground: {
          DEFAULT: "#ffffff",
          secondary: "#a0a0a0",
          muted: "#666666",
        },
        accent: {
          DEFAULT: "#00d4ff",
          hover: "#00b8e6",
        },
        card: {
          DEFAULT: "#0a0a0a",
          hover: "#141414",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;