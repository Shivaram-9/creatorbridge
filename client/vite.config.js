import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND = process.env.VITE_API_URL || "https://creatorbridge-tn9r.onrender.com";

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: BACKEND, changeOrigin: true },
      "/socket.io": { target: BACKEND, ws: true },
    },
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
});
