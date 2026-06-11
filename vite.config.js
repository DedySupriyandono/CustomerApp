import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Belanja Yuk",
        short_name: "Belanja Yuk",
        description: "Customer ordering app",
        theme_color: "#c0021a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/vite.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
    }),
  ],
  server: { port: 5173, host: true },
});
