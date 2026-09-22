import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'chat_remote',
      filename: 'remoteEntry.js',
      // Automatic .d.ts generation failed in testing (#TYPE-001) — hosts
      // declare this remote's shape by hand instead.
      dts: false,
      exposes: {
        './Chat': './src/Chat',
      },
      // @emotion/react, @emotion/styled and @mui/material are deliberately
      // NOT shared: singleton sharing across deep imports (e.g.
      // '@mui/material/Typography') hit real bugs — circular init errors,
      // and subpath imports silently bypassing the shared scope — in the
      // Rollup/Vite build this was validated against. The host passes the
      // live theme object as a prop instead — see src/Chat/index.tsx.
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
      },
    }),
  ],
  build: {
    // required by @module-federation/vite's runtime (top-level await)
    target: 'chrome89',
    modulePreload: false,
    cssCodeSplit: false,
  },
  // `cors` lets a host on another origin fetch remoteEntry.js and its chunks.
  server: { port: 5174, strictPort: true, cors: true },
  preview: { port: 5174, strictPort: true, cors: true },
});
