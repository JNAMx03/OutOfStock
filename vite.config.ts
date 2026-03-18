// /// <reference types="vitest" />

// import legacy from '@vitejs/plugin-legacy'
// import vue from '@vitejs/plugin-vue'
// import path from 'path'
// import { defineConfig } from 'vite'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     vue(),
//     legacy()
//   ],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//     },
//   },
//   test: {
//     globals: true,
//     environment: 'jsdom'
//   }
// })

// vite.config.ts
// ⚡ CONFIGURACIÓN DE VITE - Optimizado para producción

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      // 'autoUpdate': el SW se actualiza automáticamente
      registerType: 'autoUpdate',

      // Archivos que se incluyen en el SW
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],

      // Metadatos de la app (para instalar como PWA)
      manifest: {
        name: 'InventoryApp',
        short_name: 'Inventario',
        description: 'Gestión integral de inventarios multi-tienda',
        theme_color: '#3880ff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },

      // Configuración del Service Worker (Workbox)
      workbox: {
        // Cachear estos tipos de archivos automáticamente
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Estrategia para la navegación:
        // NetworkFirst = intenta red primero, cae al caché si no hay internet
        navigationPreload: true,

        runtimeCaching: [
          {
            // Cachear assets estáticos (JS, CSS, imágenes)
            urlPattern: /^https:\/\/.*\.(js|css|png|jpg|svg|woff2)$/,
            handler: 'CacheFirst',  // Primero el caché, luego la red
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
            },
          },
          {
            // Cachear llamadas a la API de AWS
            urlPattern: /^https:\/\/.*\.amazonaws\.com\/.*/,
            handler: 'NetworkFirst', // Red primero, caché como backup
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutos
              },
              networkTimeoutSeconds: 10, // Si la red tarda >10s, usar caché
            },
          },
        ],
      },
    }),

  ],

  resolve: {
    alias: {
      // El alias @ ya existe, lo mantenemos
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // ============================================
    // CHUNKING MANUAL
    // Dividir el bundle en pedazos más pequeños
    // para que el navegador pueda cachearlos mejor
    // ============================================
    rollupOptions: {
      output: {
        // manualChunks: {
        //   // Chunk 1: Vue + Vue Router (núcleo)
        //   'vue-core': ['vue', 'vue-router', '@ionic/vue', '@ionic/vue-router'],

        //   // Chunk 2: Pinia (estado global)
        //   'pinia': ['pinia'],

        //   // Chunk 3: Charts (solo se carga en el tab Finanzas)
        //   'charts': ['chart.js'],

        //   // Chunk 4: AWS Amplify (solo cuando se conecte)
        //   'aws': ['aws-amplify'],

        //   // Chunk 5: Utilidades de fecha
        //   'date-utils': ['date-fns'],
        // },
        manualChunks(id) {
          // Chunk 1: Vue + Vue Router (núcleo)
          if (id.includes('vue') || id.includes('vue-router') || id.includes('@ionic/vue') || id.includes('@ionic/vue-router')) {
            return 'vue-core';
          }
          // Chunk 2: Pinia (estado global)
          if (id.includes('pinia')) {
            return 'pinia';
          }
          // Chunk 3: Charts (solo se carga en el tab Finanzas)
          if (id.includes('chart.js')) {
            return 'charts';
          }
          // Chunk 4: AWS Amplify (solo cuando se conecte)
          if (id.includes('aws-amplify')) {
            return 'aws';
          }
          // Chunk 5: Utilidades de fecha
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
        },
      },
    },

    // ============================================
    // LÍMITE DE ADVERTENCIA DE CHUNK
    // Por defecto Vite avisa en 500kb, lo subimos
    // a 1000kb ya que Ionic es grande
    // ============================================
    chunkSizeWarningLimit: 1000,

    // ============================================
    // MINIFICACIÓN
    // 'terser' es más agresivo que 'esbuild'
    // pero requiere: npm install terser -D
    // Si prefieres rápido, usa 'esbuild' (por defecto)
    // ============================================
    minify: 'esbuild',

    // ============================================
    // SOURCEMAPS EN PRODUCCIÓN
    // false = no genera sourcemaps (menor tamaño)
    // true  = útil para debugging en producción
    // ============================================
    sourcemap: false,

    // ============================================
    // TARGET DEL BUILD
    // Browsers modernos que soportan ES modules
    // ============================================
    target: 'es2015',
  },

  // ============================================
  // OPTIMIZACIÓN DEL SERVIDOR DE DESARROLLO
  // ============================================
  optimizeDeps: {
    // Pre-bundle estas dependencias para que
    // el servidor de desarrollo arranque más rápido
    include: [
      'vue',
      'pinia',
      '@ionic/vue',
      'chart.js',
    ],
  },

  // ============================================
  // CONFIGURACIÓN DEL SERVIDOR DE DESARROLLO
  // ============================================
  server: {
    port: 5173,
    host: true, // Permite acceso desde la red local (ej: pruebas en celular)
  },
});