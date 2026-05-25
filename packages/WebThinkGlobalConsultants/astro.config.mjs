// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.SITE_URL,
  base: "/",
  output: 'server',
  adapter: vercel({
    imageService: true,
  }),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), sitemap()]
});