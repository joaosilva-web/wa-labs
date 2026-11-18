import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'seo-files',
      generateBundle() {
        const siteUrl = (globalThis as unknown as { process?: { env?: { VITE_SITE_URL?: string } } }).process?.env?.VITE_SITE_URL ?? 'https://wa-labs.vercel.app'
        const today = new Date().toISOString().slice(0, 10)

        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
        })

        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
        })
      },
    },
  ],
})
