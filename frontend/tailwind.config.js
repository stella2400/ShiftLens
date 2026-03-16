export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        neon: "0 20px 60px rgba(80, 120, 255, 0.18)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at center, rgba(255,255,255,0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};