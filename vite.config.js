import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3000,           // Tum chaaho to change kar sakte ho
    open: true            // Server start hote hi browser open karega
  },
  build: {
    target: 'esnext',     // Modern browsers ke liye
    sourcemap: true       // Debugging ke liye source maps
  },
  // Agar koi alias set karna ho to (optional)
  resolve: {
    alias: {
      // Example: '@' ko '/src' point karana
      // '@': '/src'
    }
  }
});