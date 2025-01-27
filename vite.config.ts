import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  root: "./playground", // Set the playground folder as the root
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(__dirname, ".well-known") + "/**", // Use absolute path for clarity
          dest: ".well-known", // Destination folder in the build output
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"), // Alias for your src folder
    },
  },
  build: {
    outDir: "../dist", // Ensure build output goes to the correct directory
    emptyOutDir: true,
  },
});
