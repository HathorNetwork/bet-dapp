/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    return {
      ...config,
      node: {
        __dirname: true,
      },
    };
  },
};

export default nextConfig;
