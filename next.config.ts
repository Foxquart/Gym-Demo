import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run alongside a dev server without the two
  // fighting over .next — set NEXT_DIST_DIR to a scratch folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    // AVIF first: typically 30-50% smaller than WebP at the same quality,
    // which matters most for the full-bleed photography on the landing page.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    // These ship barrel files re-exporting hundreds of modules. Without this
    // the dev server compiles every icon in lucide-react on first paint,
    // which is the single biggest cause of dev-mode scroll jank here.
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
};

export default nextConfig;
