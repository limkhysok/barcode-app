import type { NextConfig } from "next";

const DJANGO_URL = process.env.DJANGO_INTERNAL_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["172.18.112.1", "192.168.0.189"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${DJANGO_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
