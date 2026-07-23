/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  // public/shop/index.html is the catalog. Without these, /shop 404s
  // (Next redirects /shop/ → /shop, then misses the static index).
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/shop', destination: '/shop/index.html' },
      { source: '/shop/', destination: '/shop/index.html' },
    ];
  },
};

export default nextConfig;
