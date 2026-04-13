/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 24px 80px rgba(255, 68, 183, 0.18)",
      },
      backgroundImage: {
        "giggifi-gradient":
          "linear-gradient(135deg,#a53eff,#ff44b7,#ffb13e)",
      },
      colors: {
        background: "#06020b",
        surface: "#0f0918",
        card: "#0d0717",
        gold: "#ffb340",
      },
    },
  },
  plugins: [],
};
