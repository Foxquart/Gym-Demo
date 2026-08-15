import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run alongside a dev server without the two
  // fighting over .next — set NEXT_DIST_DIR to a scratch folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
