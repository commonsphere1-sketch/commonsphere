import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: "./static",
  /* Root-absolute, not "./": the app uses BrowserRouter, so a page such as
     /dashboard/countries loaded directly (a refresh, a shared link) would
     resolve "./assets/…" to /dashboard/assets/… and come up blank. The map
     data and fonts are already fetched from /geo and /fonts. */
  base: "/",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
