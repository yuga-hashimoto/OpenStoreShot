import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      },
      colors: {
        studio: {
          ink: "#0b111c",
          panel: "#101827",
          rail: "#0f172a",
          line: "#263244",
          canvas: "#f8fafc",
          mint: "#2dd4bf",
          amber: "#f59e0b"
        }
      }
    }
  },
  plugins: []
};

export default config;
