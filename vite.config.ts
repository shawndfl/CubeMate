import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { BlockEditorPlugin } from './block-editor-plugin.ts';

export default defineConfig({
  plugins: [BlockEditorPlugin.create()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        atlasPicker: resolve(process.cwd(), 'atlas-picker.html'),
      },
    },
  },
});
