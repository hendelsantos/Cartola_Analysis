/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s.glbimg.com",
      },
      {
        protocol: "https",
        hostname: "s2.glbimg.com",
      },
      {
        protocol: "https",
        hostname: "s3.glbimg.com",
      },
    ],
  },
};

export default nextConfig;
