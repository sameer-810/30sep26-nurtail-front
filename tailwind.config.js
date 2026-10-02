/** @type {import('tailwindcss').Config} */
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        background: token("background"),
        foreground: token("foreground"),
        primary: { DEFAULT: token("primary"), foreground: token("primary-foreground") },
        secondary: { DEFAULT: token("secondary"), foreground: token("secondary-foreground") },
        destructive: { DEFAULT: token("destructive"), foreground: token("destructive-foreground") },
        success: { DEFAULT: token("success"), foreground: token("success-foreground") },
        warning: { DEFAULT: token("warning"), foreground: token("warning-foreground") },
        info: { DEFAULT: token("info"), foreground: token("info-foreground") },
        muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
        accent: { DEFAULT: token("accent"), foreground: token("accent-foreground") },
        card: { DEFAULT: token("card"), foreground: token("card-foreground") },
        popover: { DEFAULT: token("popover"), foreground: token("popover-foreground") },
        sidebar: {
          DEFAULT: token("sidebar"),
          foreground: token("sidebar-foreground"),
          primary: token("sidebar-primary"),
          "primary-foreground": token("sidebar-primary-foreground"),
          accent: token("sidebar-accent"),
          "accent-foreground": token("sidebar-accent-foreground"),
          border: token("sidebar-border"),
        },
        /**
         * Brand accents from the guidelines. Decorative fills and tints only —
         * champagne and coral both fail 4.5:1 as text on white, so they never
         * carry text on their own. Text on a brand tint uses the matching
         * `-ink` shade.
         */
        brand: {
          forest: "#0E4D43",
          teal: "#1F6B60",
          sage: "#8FAE8B",
          gold: "#D4B581",
          coral: "#F97B68",
          sky: "#7CB3E6",
          beige: "#F7F2E8",
          mint: "#E8F1E9",
          "gold-ink": "#6E5418",
          "coral-ink": "#9A2F1F",
          "sage-ink": "#2F4F2C",
          "sky-ink": "#1F4F7A",
        },
      },
      /**
       * Elevation. The hairline border is a shadow so it never adds to layout
       * and adapts to the theme; real shadows only on floating layers.
       */
      boxShadow: {
        card: "0 0 0 1px hsl(var(--border)), 0 1px 2px rgba(0,0,0,0.03)",
        lift: "0 0 0 1px hsl(var(--input)), 0 4px 12px rgba(14,77,67,0.08)",
        popover:
          "0 0 0 1px hsl(var(--border)), 0 8px 16px -4px rgba(0,0,0,0.06), 0 24px 32px -8px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
      },
      /**
       * Brand type: Playfair Display for headlines, Montserrat for everything
       * else. Never a third family — refs, microchips and figures use
       * Montserrat with tabular numerals (`.nt-nums`).
       */
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
      },
      keyframes: {
        "overlay-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-in-right": {
          from: { transform: "translateX(24px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "overlay-in": "overlay-in 120ms ease-out",
        "slide-in-right": "slide-in-right 160ms ease-out",
      },
    },
  },
  plugins: [],
};
