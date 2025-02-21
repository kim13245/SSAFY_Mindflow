import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  define: {
    "process.env.VITE_API_BASE_URL": JSON.stringify(process.env.VITE_API_BASE_URL),
    "process.env.VITE_APP_SOCKET_BASE_URL": JSON.stringify(process.env.VITE_APP_SOCKET_BASE_URL),
  },
  optimizeDeps: {
    include: ["lucide-react"],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
})
