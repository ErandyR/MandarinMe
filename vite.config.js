import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/",

  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        dictionary: resolve(__dirname, "src/dictionary/index.html"),
        flashcards: resolve(__dirname, "src/flashcards/index.html"),
        phrase: resolve(__dirname, "src/phrase/index.html"),
      },
    },
  },
});
