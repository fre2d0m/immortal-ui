import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@/lib/telemetry": fileURLToPath(
        new URL("./registry/immortal/components/telemetry.ts", import.meta.url),
      ),
      "@/components/iot": fileURLToPath(
        new URL("./registry/immortal/components", import.meta.url),
      ),
      "@/components/blocks": fileURLToPath(
        new URL("./registry/immortal/blocks", import.meta.url),
      ),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: { host: "127.0.0.1", port: 4177, strictPort: true },
});
