// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";
import AstroPWA from "@vite-pwa/astro";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  site: "https://carincon93.github.io",
  base: "sticky-notes-app",

  integrations: [
    react(),
    AstroPWA({
      mode: "development",
      base: "/sticky-notes-app/",
      scope: "/sticky-notes-app/",
      includeAssets: ["favicon.svg"],
      registerType: "autoUpdate",
      manifest: {
        name: "Astro PWA",
        short_name: "Astro PWA",
        theme_color: "#ffffff",
        icons: [],
      },
      workbox: {
        navigateFallback: "/sticky-notes-app/index.html",
        globPatterns: ["**/*.{css,js,html,svg,riv,png,webp,ico,txt}"],
      },
      devOptions: {
        enabled: true,
        navigateFallbackAllowlist: [/^\/$/],
      },
      experimental: {
        directoryAndTrailingSlashHandler: true,
      },
    }),
  ],
});
