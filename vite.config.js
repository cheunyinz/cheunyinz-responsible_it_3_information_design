import { defineConfig } from 'vite';
import { resolve } from 'path';
export default defineConfig({
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                fetch: resolve(__dirname, 'fetch.html'),
                final: resolve(__dirname, 'final.html'),
            }
        }
    },
});