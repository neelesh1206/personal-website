import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neeleshkakaraparthi.dev'
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/admin/*', '/api/*'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
