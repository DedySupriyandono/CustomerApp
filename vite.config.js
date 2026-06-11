import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Pakai includeAssets supaya icon ikut precached service worker.
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "Belanja Yuk",
        short_name: "Belanja Yuk",
        description: "Aplikasi belanja online",
        theme_color: "#c0021a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "id",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          // maskable supaya Android adaptive-icon kerja (no white border).
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        // Cache navigation + asset; biarkan API calls ke runtime cache jaringan.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        // Fallback ke index.html untuk SPA routes saat offline.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  server: { port: 5173, host: true },
});
