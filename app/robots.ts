import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://www.vcrrecords.com/sitemap.xml',
    host: 'https://www.vcrrecords.com',
  };
}
