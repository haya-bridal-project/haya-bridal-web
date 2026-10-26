import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    qualities: [60, 75, 85],
  },
  poweredByHeader: false,
};

export default nextConfig;
