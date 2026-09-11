import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    base: './',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.svg'],
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
                navigateFallback: 'index.html',
            },
            manifest: {
                name: 'Tonifica 12',
                short_name: 'Tonifica 12',
                description: 'Programma di allenamento in palestra di 12 settimane, con registro dei carichi, timer e progressione automatica.',
                lang: 'it',
                start_url: './',
                scope: './',
                display: 'standalone',
                orientation: 'portrait',
                background_color: '#FFD400',
                theme_color: '#FFD400',
                icons: [
                    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
        }),
    ],
    test: {
        globals: true,
        environment: 'node',
        include: ['src/tests/**/*.test.ts'],
    },
});
