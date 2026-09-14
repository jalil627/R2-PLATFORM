import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.PLATFORM_URL || 'http://localhost:3000'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/dashboard', '/creator'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}