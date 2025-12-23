
import { defineConfig } from 'vite';

export default defineConfig({
    // Root is current directory since we moved index.html here
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        open: true,
    },
    // Ensure we can import from src
    resolve: {
        alias: {
            '/src': '/src'
        }
    }
});
