/**
 * vite.config.js — Vite build tool configuration
 *
 * What this file does:
 *   - Tells Vite to use the React plugin (so JSX works)
 *   - Tells Vite to use the Tailwind CSS plugin
 *   - Sets up a proxy so API calls to /api go to our FastAPI backend
 *
 * Why the proxy?
 *   - Our React app runs on port 5173
 *   - Our FastAPI backend runs on port 8000
 *   - Instead of writing "http://localhost:8000/api/..." everywhere,
 *     we just write "/api/..." and Vite forwards it automatically
 */

import { defineConfig } from 'vite'
// defineConfig: a helper that gives us autocomplete for config options

import react from '@vitejs/plugin-react'
// react plugin: makes Vite understand JSX (React's HTML-like syntax)

import tailwindcss from '@tailwindcss/vite'
// tailwindcss plugin: processes Tailwind CSS classes

export default defineConfig({
  plugins: [
    react(),        // Enable React/JSX support
    tailwindcss(),  // Enable Tailwind CSS
  ],
  server: {
    port: 5173,     // Run the dev server on port 5173
    proxy: {
      // Any request starting with /api will be forwarded to our backend
      '/api': {
        target: 'http://localhost:8000',  // Our FastAPI backend address
        changeOrigin: true,               // Needed for virtual hosted sites
        rewrite: (path) => path.replace(/^\/api/, ''),
        // rewrite: removes the /api prefix before forwarding
        // So /api/generate-story becomes /generate-story on the backend
      },
    },
  },
})
