import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  allowedDevOrigins: ["172.18.112.1", "192.168.0.189", "x8wx38mg-3000.asse.devtunnels.ms"],
  async rewrites() {
    const djangoUrl = process.env.DJANGO_INTERNAL_URL ?? "http://127.0.0.1:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${djangoUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
