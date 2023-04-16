import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/monopoly-deal/",
  build: {
    outDir: "build",
  },
  plugins: [react()],
  server: {
    open: true,
  },
});
