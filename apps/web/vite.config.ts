/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig(({ mode }) => {
  // Shares the repo-root .env with the API, so both agree on ports.
  const env = loadEnv(mode, repoRoot, "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
    },
    server: {
      port: Number(env.WEB_PORT ?? 5173),
      // Fail rather than silently move to another port: email links and WEB_ORIGIN assume this one.
      strictPort: true,
      proxy: {
        "/api": `http://localhost:${env.API_PORT ?? 8787}`,
      },
    },
  };
});
