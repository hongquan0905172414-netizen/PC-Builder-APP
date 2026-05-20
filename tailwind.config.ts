import type { Config } from "tailwindcss";

/**
 * RIG design tokens.
 *
 * This file is the "Design" layer of our Skeleton/Design/Brains
 * separation. All colors, spacing, typography, etc. should be defined
 * here as tokens — never hardcoded in components.
 *
 * Add tokens as the design system develops. Keep it minimal until we
 * actually need a token.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define brand colors here as we develop the visual identity.
        // Example placeholders — replace when design direction is set:
        // rig: {
        //   bg: "#0a0a0a",
        //   surface: "#171717",
        //   primary: "#...",
        //   warning: "#...",
        //   danger: "#...",
        // },
      },
      fontFamily: {
        // Define typography tokens here.
        // Example:
        // display: ["...", "sans-serif"],
        // body: ["...", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
