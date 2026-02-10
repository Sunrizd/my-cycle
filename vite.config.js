import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: parseInt(env.FRONTEND_PORT) || 5173,
      allowedHosts: env.ALLOWED_HOSTS ? env.ALLOWED_HOSTS.split(',') : [],
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.PORT || 3005}`,
          changeOrigin: true,
          secure: false
        },
        '/auth': {
          target: `http://127.0.0.1:${env.PORT || 3005}`,
          changeOrigin: true,
          secure: false
        },
        '/share': {
          target: `http://127.0.0.1:${env.PORT || 3005}`,
          changeOrigin: true,
          secure: false
        }
      }
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'My Cycle',
          short_name: 'My Cycle',
          description: 'Suivi de cycle menstruel simple et respectueux de la vie privée.',
          theme_color: '#F4F7F5',
          background_color: '#F4F7F5',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ]
  };
});
