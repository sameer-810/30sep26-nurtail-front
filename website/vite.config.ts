import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Multi-page: each prerendered page is its own file, and unknown URLs 404
  // instead of silently serving the home page.
  appType: "mpa",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { port: 5190, strictPort: true },
  preview: { port: 5190, strictPort: true },
});
