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
      url: 'https://www.vcrrecords.com/shop/',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.vcrrecords.com/shop/home.html',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://www.vcrrecords.com/shop/summer.html',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://www.vcrrecords.com/shop/lion.html',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://www.vcrrecords.com/shop/rack.html',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://www.vcrrecords.com/shop/about.html',
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: 'https://www.vcrrecords.com/shop/contact.html',
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];
}
