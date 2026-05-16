import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/debug-analysis/'],
    },
    sitemap: 'https://aipandit.com/sitemap.xml',
  };
}
