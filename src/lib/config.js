/**
 * API Configuration
 *
 * Development: Uses Vite proxy (/api -> http://localhost:4000)
 * Production: Uses deployed backend at https://ai-resume-builder-backend-uhdm.onrender.com
 *
 * To override in production, set VITE_API_BASE_URL in your .env:
 * VITE_API_BASE_URL=https://your-custom-api.onrender.com/api/v1
 */

const isDevelopment = import.meta.env.DEV;
const envApiUrl = import.meta.env.VITE_API_BASE_URL;

// In development, use empty string to leverage Vite proxy
// In production, use environment variable or fallback
export const API_BASE = isDevelopment
  ? ""
  : envApiUrl || "https://ai-resume-builder-backend-uhdm.onrender.com/api/v1";

// Log configuration in development
if (isDevelopment) {
  console.log("🔧 API Config:", {
    mode: "development",
    baseURL: API_BASE || "/api (proxied)",
    proxyTarget: "http://localhost:4000",
  });
} else {
  console.log("🔧 API Config:", {
    mode: "production",
    baseURL: API_BASE,
    backend: "https://ai-resume-builder-backend-uhdm.onrender.com",
  });
}
