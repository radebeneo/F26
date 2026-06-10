import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── World Cup 2026 Design Tokens ──────────────────────────────────
      colors: {
        // Semantic
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // Brand palette
        navy: {
          50:  "hsl(220 60% 97%)",
          100: "hsl(220 60% 92%)",
          200: "hsl(220 60% 82%)",
          300: "hsl(220 60% 65%)",
          400: "hsl(220 60% 50%)",
          500: "hsl(220 60% 38%)",
          600: "hsl(220 70% 28%)",
          700: "hsl(220 75% 20%)",
          800: "hsl(220 80% 14%)",
          900: "hsl(220 85% 9%)",
          950: "hsl(220 90% 6%)",
        },
        gold: {
          50:  "hsl(43 100% 97%)",
          100: "hsl(43 100% 90%)",
          200: "hsl(43 100% 78%)",
          300: "hsl(43 100% 66%)",
          400: "hsl(43 100% 54%)",
          500: "hsl(43 96% 47%)",  // primary gold
          600: "hsl(38 92% 40%)",
          700: "hsl(33 88% 33%)",
          800: "hsl(28 80% 26%)",
          900: "hsl(23 70% 20%)",
        },
        crimson: {
          400: "hsl(348 80% 55%)",
          500: "hsl(348 83% 47%)",
          600: "hsl(348 86% 38%)",
        },
        pitch: {
          light: "hsl(130 50% 40%)",
          DEFAULT: "hsl(130 55% 33%)",
          dark: "hsl(130 60% 24%)",
          stripe: "hsl(130 55% 30%)",
        },
      },

      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        // Shadcn accordion
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Custom
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.5" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        shimmer:          "shimmer 2s linear infinite",
        "fade-in":        "fade-in 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.35s ease-out",
        pulse:            "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      backgroundImage: {
        "pitch-gradient":
          "repeating-linear-gradient(90deg, hsl(130 55% 33%) 0px, hsl(130 55% 33%) 48px, hsl(130 55% 30%) 48px, hsl(130 55% 30%) 96px)",
        "gold-shimmer":
          "linear-gradient(90deg, transparent 25%, hsl(43 100% 70% / 0.4) 50%, transparent 75%)",
      },
    },
  },
  plugins: [],
};

export default config;
