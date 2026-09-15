import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "./package.json";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Không đóng gói bất kỳ dependency / peerDependency nào vào dist.
 * Consumer sẽ tự cài và dùng chung một bản (tránh 2 React, 2 i18next, 2 router context...).
 */
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  /^react(\/.*)?$/, // react, react/jsx-runtime, react/jsx-dev-runtime
  /^react-dom(\/.*)?$/, // react-dom, react-dom/client
  /^react-router(-dom)?(\/.*)?$/,
  /^ckeditor5(\/.*)?$/, // ckeditor5, ckeditor5/ckeditor5.css, ...
  /^@ckeditor\/.*/,
  /^echarts(\/.*)?$/,
  /^i18next(\/.*)?$/,
  /^react-i18next(\/.*)?$/,
  /^date-fns(\/.*)?$/,
];

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: "./tsconfig.app.json",
      include: ["src"],
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "EbigLibrary",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    rollupOptions: {
      external,
      output: {
        // Gom CSS thành 1 file dist/style.css để consumer import "ebig-library/style.css"
        assetFileNames: (assetInfo) =>
          assetInfo.names?.some((n) => n.endsWith(".css")) ? "style.css" : "[name][extname]",
      },
    },
    sourcemap: true,
    emptyOutDir: true,
    target: "es2020",
  },
});