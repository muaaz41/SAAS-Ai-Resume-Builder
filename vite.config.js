import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://ai-resume-builder-backend-uhdm.onrender.com",
        changeOrigin: true,
        // Ensure cookies set from backend are accepted in dev
        secure: true,
      },
    },
  },
});
