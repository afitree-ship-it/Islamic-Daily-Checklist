import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'DeenTracker - เช็คลิสต์ความดีประจำวัน',
            short_name: 'DeenTracker',
            description: 'แอปพลิเคชันบันทึกเช็คลิสต์ความดีและการปฏิบัติศาสนกิจประจำวัน',
            theme_color: '#022c22',
            background_color: '#022c22',
            display: "standalone",
            icons: [
              {
                src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23022c22"/><text x="50" y="65" font-size="50" text-anchor="middle" fill="%2334d399">🕌</text></svg>',
                sizes: '192x192',
                type: 'image/svg+xml'
              },
              {
                src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23022c22"/><text x="50" y="65" font-size="50" text-anchor="middle" fill="%2334d399">🕌</text></svg>',
                sizes: '512x512',
                type: 'image/svg+xml'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
