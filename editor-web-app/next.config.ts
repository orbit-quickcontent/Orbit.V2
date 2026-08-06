import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3003";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${WS_URL}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
