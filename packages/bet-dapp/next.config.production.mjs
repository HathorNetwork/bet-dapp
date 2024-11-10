/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: "/public",
  assetPrefix: "https://betting.hathor.network/",
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
