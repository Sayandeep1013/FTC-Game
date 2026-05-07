import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Generic external card images (wikia, fandom, etc.)
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
