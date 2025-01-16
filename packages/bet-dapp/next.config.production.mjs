/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: "",
  assetPrefix: "https://betting.hathor.network/",
  async rewrites() {
    return [
      {
        source: '/fonts/:path*',
        destination: '/public/fonts/:path*',
      },
    ];
  },
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Add module rule for font files
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]'
      }
    });

    return {
      ...config,
      node: {
        __dirname: true,
      },
    };
  },
};

export default nextConfig;
