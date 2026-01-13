import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh({ serverEntry: "./main.tsx" }), tailwindcss()],
  css: {
    devSourcemap: true,
  },
  build: {
    cssCodeSplit: false,
  },
  server: {
    proxy: {
      // Proxy WebSocket requests to separate backend on port 8000
      "/api": {
        target: "ws://localhost:8000",
        ws: true,
      },
    },
  },
});
