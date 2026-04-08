import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), dts()],
  build: {
    cssCodeSplit: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "ebig-library",
      fileName: (format) => `index.${format}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react-router-dom",
        "ckeditor5",           // ✅ externalize the whole package
        "@ckeditor/ckeditor5-react",
        /^ckeditor5\/.*/,      // ✅ externalize ALL ckeditor5 sub-paths including ckeditor5/ckeditor5.css
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          ckeditor5: "CKEDITOR",
          "@ckeditor/ckeditor5-react": "CKEditorReact",
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) return "style.css";
          return assetInfo.name!;
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    extensions: [".tsx", ".ts", ".js"],
  },
});