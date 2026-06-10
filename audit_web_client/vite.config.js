import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Migrated from Create React App. Two CRA-isms are preserved here:
//  - absolute imports rooted at the project (e.g. `import theme from 'src/theme'`),
//    which CRA enabled via jsconfig.json's baseUrl.
//  - `.js` files that contain JSX (CRA allowed this; esbuild needs to be told).
const proxyTarget = 'https://localhost:5000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Treat every .js file in src/ as JSX so we don't have to rename ~50 files.
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy backend routes to the Flask dev server (was src/setupProxy.js).
      '/api': { target: proxyTarget, changeOrigin: true, secure: false },
      '/auth': { target: proxyTarget, changeOrigin: true, secure: false },
    },
  },
  build: {
    // Keep CRA's output directory so deploy.sh and the Flask static-file
    // symlink (ln -s build flask/api/www) continue to work unchanged.
    outDir: 'build',
  },
});
