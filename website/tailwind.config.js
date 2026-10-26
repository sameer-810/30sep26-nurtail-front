/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: "#0E4D43", deep: "#0B2B26", night: "#0A1F1B", 600: "#12594D" },
        sage: { DEFAULT: "#8FAE8B", ink: "#2F4F2C" },
        gold: { DEFAULT: "#D4B581", ink: "#6E5418", soft: "#F6EEDD" },
        coral: { DEFAULT: "#F97B68", ink: "#9A2F1F", soft: "#FDEAE6" },
        sky: { DEFAULT: "#7CB3E6", ink: "#1F4F7A", soft: "#E7F0FA" },
        beige: "#F7F2E8",
        mint: "#E8F1E9",
        paper: "#FAF9F6",
        ink: { DEFAULT: "#15302B", muted: "#526460" },
        line: "#E3DED3",
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
      },
      maxWidth: { page: "1200px", wide: "1280px" },
      /**
       * Elevation: a forest-tinted hairline is the "border"; real shadows only
       * on things that float (product cards, the photo).
       */
      boxShadow: {
        card: "0 0 0 1px rgba(14,77,67,0.07), 0 1px 2px rgba(0,0,0,0.03)",
        hover: "0 0 0 1px rgba(14,77,67,0.12), 0 8px 24px -12px rgba(11,43,38,0.18)",
        float: "0 0 0 1px rgba(14,77,67,0.08), 0 24px 48px -16px rgba(11,43,38,0.28)",
        photo: "0 48px 80px -32px rgba(11,43,38,0.45)",
      },
      keyframes: {
        // Transform only: fading the hero headline from opacity 0 would delay Largest Contentful Paint.
        rise: { from: { transform: "translateY(14px)" }, to: { transform: "none" } },
        "rise-fade": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "none" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-7px)" },
        },
        unveil: {
          from: { clipPath: "inset(0 0 100% 0 round 24px)" },
          to: { clipPath: "inset(0 0 0 0 round 24px)" },
        },
      },
      animation: {
        rise: "rise 480ms cubic-bezier(0.23,1,0.32,1) both",
        "rise-fade": "rise-fade 480ms cubic-bezier(0.23,1,0.32,1) both",
        float: "float 6s ease-in-out infinite",
        unveil: "unveil 900ms cubic-bezier(0.77,0,0.175,1) both",
      },
    },
  },
  plugins: [],
};
