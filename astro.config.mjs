// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';


// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://docs.applivery.com',

  // Internationalization configuration
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'zh', 'ko'],
    routing: {
      prefixDefaultLocale: true, // Use /en/ prefix for English too
      redirectToDefaultLocale: false, // We handle redirects in middleware
    },
    fallback: {
      es: 'en',
      fr: 'en',
      de: 'en',
      pt: 'en',
      it: 'en',
      ja: 'en',
      zh: 'en',
      ko: 'en',
    },
  },

  integrations: [
    mdx(),
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          es: 'es-ES',
          fr: 'fr-FR',
          de: 'de-DE',
          pt: 'pt-BR',
          it: 'it-IT',
          ja: 'ja-JP',
          zh: 'zh-CN',
          ko: 'ko-KR',
        },
      },
    }),
    tailwind({
      applyBaseStyles: false,
    }),
  ],

  // Enable View Transitions for smooth navigation
  experimental: {
    // Uncomment if you want to enable View Transitions
    // viewTransitions: true,
  },

  // Markdown configuration
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },

  // Build configuration
  build: {
    inlineStylesheets: 'auto',
  },

  // Vite configuration
  vite: {
    envPrefix: ['PUBLIC_', 'CMS_'],
    optimizeDeps: {
      exclude: ['@astrojs/mdx'],
    },
    server: {
      proxy: {
        '/_r2': {
          target: process.env.CMS_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  },

  // Output configuration - static for SSG
  output: 'static',

  // Note: Middleware only runs during dev server.
  // For production, redirects are handled by:
  // 1. Legacy redirect routes ([...slug].astro, [collection]/index.astro)
  // 2. Server-side redirects in your hosting platform (Netlify _redirects, Vercel vercel.json, etc.)

  // Prefetch configuration
  prefetch: {
    defaultStrategy: 'hover',
    prefetchAll: false,
  },

  // Server configuration for development
  server: {
    port: 4444,
    host: true,
  },
});
