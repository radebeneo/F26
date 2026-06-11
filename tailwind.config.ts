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
        // Brand palette from web-colors.png
        neutral: {
          50:  "#f7f7f8", 100: "#ededf1", 200: "#d8d9df", 300: "#b6b7c3",
          400: "#8e90a2", 500: "#707287", 600: "#5a5b6f", 700: "#49495b",
          800: "#3f404d", 900: "#383842", 950: "#29292e",
        },
        primaryBrand: {
          50:  "#edf9ff", 100: "#d7f0ff", 200: "#b9e7ff", 300: "#88daff",
          400: "#50c3ff", 500: "#28a5ff", 600: "#0a84ff", 700: "#005cff",
          800: "#004bd5", 900: "#0244a6", 950: "#03122b",
        },
        secondaryGreen: {
          50:  "#f1fcf3", 100: "#defae4", 200: "#bef4cb", 300: "#8beaa2",
          400: "#51d772", 500: "#30d158", 600: "#1d9c3d", 700: "#1a7b32",
          800: "#1a612d", 900: "#175027", 950: "#072c12",
        },
        secondaryRed: {
          50:  "#fff1f2", 100: "#ffe4e7", 200: "#fecdd4", 300: "#fda4b1",
          400: "#fc7088", 500: "#f43056", 600: "#e21c4c", 700: "#bf1140",
          800: "#a0113c", 900: "#88133a", 950: "#4c051b",
        },
        secondaryYellow: {
          50:  "#fffcea", 100: "#fff3c5", 200: "#ffe785", 300: "#ffd346",
          400: "#ffbe1b", 500: "#ff9f0a", 600: "#e27300", 700: "#bb4e02",
          800: "#7c320b", 900: "#572205", 950: "#481800",
        },
        pitch: {
          light: "#51d772",
          DEFAULT: "#30d158",
          dark: "#1d9c3d",
          stripe: "#2fc253",
        },
      },

      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-sans)"],
        mono: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        "semi-expanded": ["var(--font-semi-expanded)"],
        condensed: ["var(--font-condensed)"],
        "ultra-condensed": ["var(--font-ultra-condensed)"],
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
