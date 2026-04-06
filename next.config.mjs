/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Hide the “N” dev indicator (bottom-left) on localhost; production is unchanged. */
  devIndicators: false,
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
