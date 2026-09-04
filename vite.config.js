import {
  defineConfig
} from "vite";
import react from "@vitejs/plugin-react";
import {
  VitePWA
} from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
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
        id: "/",
        lang: "id",
        icons: [{
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],

  server: {
    port: 5032,
    host: true,
    allowedHosts: ["dev-belanjayuk.modoto.net"],
  },

  preview: {
    port: 5032,
    host: true,
    allowedHosts: ["dev-belanjayuk.modoto.net"],
  },
});