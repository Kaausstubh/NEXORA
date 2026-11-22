import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ivory: "#F7F6F2",
        charcoal: {
          DEFAULT: "#191A18",
          light: "#242523",
          surface: "#1F201E",
          border: "#2E302C",
        },
        lime: {
          DEFAULT: "#C7F36B",
          hover: "#b5e855",
          dim: "rgba(199, 243, 107, 0.15)",
        },
        burnt: {
          orange: "#E58B5A",
          dim: "rgba(229, 139, 90, 0.15)",
        },
        stone: {
          DEFAULT: "#85857D",
          light: "#A4A49C",
          dark: "#575751",
        },
        border: {
          DEFAULT: "#E7E6DF",
          dark: "#2A2B28",
        },
        card: {
          DEFAULT: "#FFFFFF",
          dark: "#20211F",
        }
      },
      fontFamily: {
        heading: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'premium': '0 10px 25px -5px rgba(25, 26, 24, 0.05), 0 8px 10px -6px rgba(25, 26, 24, 0.05)',
        'lime-glow': '0 0 20px rgba(199, 243, 107, 0.35)',
      }
    },
  },
  plugins: [],
};
export default config;
