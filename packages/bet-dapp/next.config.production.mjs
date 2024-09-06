/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: "/betting2024",
  assetPrefix: "https://hathor.network/betting2024/",
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
