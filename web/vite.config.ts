import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: new URL(".", import.meta.url).pathname,
  plugins: [react()],
  server: {
    // The repository is commonly edited through WSL on /mnt; polling keeps HMR reliable there.
    watch: { usePolling: true, interval: 150 },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
