import { getRequestListener } from "@hono/node-server";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { app } from "./api/index.js";
import dotenv from "dotenv";
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'


if (process.env.NODE_ENV === "development") {
  dotenv.config();
}

export default defineConfig({
  build: {
    target: "es2022",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
  plugins: [
    react(),
    TanStackRouterVite(),
    {
      name: "api-server",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith("/api")) {
            return next();
          }
          getRequestListener(async (request) => {
            return await app.fetch(request, {});
          })(req, res);
        });
      },
    },
  ],
});
