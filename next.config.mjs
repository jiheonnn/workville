/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // experimental: {
  //   optimizeCss: true, // Temporarily disabled due to critters module error
  // },
  compress: true,
  poweredByHeader: false,
}

export default nextConfig