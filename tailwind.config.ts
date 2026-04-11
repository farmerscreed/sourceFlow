import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SourceFlow Design System
        primary: {
          DEFAULT: "#1B3A5C",
          light: "#D6E4F0",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#C8952E",
          foreground: "#FFFFFF",
        },
        success: "#16A34A",
        warning: "#EAB308",
        danger: "#DC2626",

        // Semantic colors
        background: "#FFFFFF",
        "bg-subtle": "#F8FAFC",
        foreground: "#1E293B",
        "text-muted": "#94A3B8",
        border: "#E2E8F0",

        // Category colors
        category: {
          "windows-doors": "#2563EB",
          "cladding": "#7C3AED",
          "railings-metalwork": "#059669",
          "roofing": "#DC2626",
          "solar-panels": "#EAB308",
          "solar-inverters": "#F59E0B",
          "solar-batteries": "#84CC16",
          "smart-home": "#06B6D4",
          "cctv-security": "#6366F1",
          "lighting": "#F97316",
          "electrical": "#8B5CF6",
          "plumbing": "#0EA5E9",
          "building-materials": "#78716C",
          "water-treatment": "#14B8A6",
          "fire-safety": "#EF4444",
          "other": "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.08)",
        "modal": "0 4px 24px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
