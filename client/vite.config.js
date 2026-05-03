import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND = process.env.VITE_API_URL || "http://localhost:5000";

export default defineConfig({
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
