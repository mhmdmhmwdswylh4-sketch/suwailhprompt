import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#06070a", 900: "#0a0c11", 800: "#10131a", 700: "#171b24" },
        mint: { DEFAULT: "#7cf2b5", dim: "#4fd69a" },
        ice: "#5ad1ff",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-arabic)", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
        spotlight: {
          "0%": { opacity: "0", transform: "translate(-72%, -62%) scale(0.5)" },
          "100%": { opacity: "1", transform: "translate(-50%, -40%) scale(1)" },
        },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-100%)" } },
        "marquee-rev": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        "aurora-a": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(60px,40px,0) scale(1.15)" },
        },
        "aurora-b": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1.1)" },
          "50%": { transform: "translate3d(-70px,-30px,0) scale(0.95)" },
        },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: {
        shimmer: "shimmer 3s linear infinite",
        spotlight: "spotlight 2s ease .75s 1 forwards",
        marquee: "marquee 38s linear infinite",
        "marquee-rev": "marquee-rev 44s linear infinite",
        "aurora-a": "aurora-a 22s ease-in-out infinite",
        "aurora-b": "aurora-b 28s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
