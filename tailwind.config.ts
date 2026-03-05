import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        "bounce-slow": "bounceSlow 3s ease-in-out infinite",
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "shimmer": "shimmer 2s ease-in-out infinite",
      },
      keyframes: {
        bounceSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%, 100%": {
            textShadow:
              "0 0 20px rgba(255,200,0,0.8), 0 0 40px rgba(255,150,0,0.4)",
          },
          "50%": {
            textShadow:
              "0 0 30px rgba(255,220,0,1), 0 0 60px rgba(255,180,0,0.6)",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
