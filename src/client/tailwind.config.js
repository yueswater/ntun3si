import daisyui from "daisyui";
import { ntun3siOcean, ntun3siDashboard } from "./src/theme/colors.js";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [daisyui, require("@tailwindcss/typography")],
  daisyui: {
    themes: [
      { "ntun3si-ocean": ntun3siOcean },
      { "ntun3si-dashboard": ntun3siDashboard },
    ],
  },
};
