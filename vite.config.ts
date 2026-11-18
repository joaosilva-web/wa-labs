import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [
      react(),
      {
        name: 'seo-files',
        generateBundle() {
          if (!env.VITE_SITE_URL) {
            throw new Error(
              '[seo-files] VITE_SITE_URL não está definida no .env. ' +
              'Defina a URL do site antes de fazer o build.',
            )
          }
          // Remove barra final para montar URLs consistentes
          const siteUrl = env.VITE_SITE_URL.replace(/\/$/, '')
          const today = new Date().toISOString().slice(0, 10)

          this.emitFile({
            type: 'asset',
            fileName: 'robots.txt',
            source: `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
          })

          this.emitFile({
            type: 'asset',
            fileName: 'sitemap.xml',
            source: [
              '<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
              '  <url>',
              `    <loc>${siteUrl}/</loc>`,
              `    <lastmod>${today}</lastmod>`,
              '    <changefreq>monthly</changefreq>',
              '    <priority>1.0</priority>',
              '  </url>',
              '</urlset>',
              '',
            ].join('\n'),
          })
        },
      },
    ],
  }
})
