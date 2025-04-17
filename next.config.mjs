// next.config.mjs

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      process.env.R2_BUCKET_ENDPOINT?.split('://')[1] || process.env.R2_BUCKET_ENDPOINT,
      'placeholder.com',
    ].filter(Boolean),
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    R2_BUCKET_ENDPOINT: process.env.R2_BUCKET_ENDPOINT,
  },
};

export default nextConfig;