import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: 'https://www.vcrrecords.com/',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://www.vcrrecords.com/shop',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];
}
