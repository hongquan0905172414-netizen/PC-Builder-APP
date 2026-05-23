/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for the React frontend.
// Also includes Vitest settings (the "test" section) since Vitest
// is built to work alongside Vite.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy /api requests to the Express server during development.
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  test: {
    // Where Vitest looks for test files: any file ending in
    // .test.js inside src/.
    include: ["src/**/*.test.js"],
  },
});
