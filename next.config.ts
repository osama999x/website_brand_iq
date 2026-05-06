import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avoid Next Image Optimizer SSRF restrictions for localhost/private IP assets
    // while still using next/image for layout and responsive behavior.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3015",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
