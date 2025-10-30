import daisyui from "daisyui";
import { ntun3siOcean, ntun3siDashboard } from "./src/theme/colors.js";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [daisyui, require("@tailwindcss/typography")],
  daisyui: {
    themes: [
      { "ntun3si-ocean": ntun3siOcean },
      { "ntun3si-dashboard": ntun3siDashboard },
    ],
  },
};
