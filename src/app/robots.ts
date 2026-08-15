import type { MetadataRoute } from "next";

const BASE_URL = "https://emberathletic.club";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Member-only and transactional areas: nothing here belongs in an index.
        disallow: ["/dashboard", "/admin", "/checkout", "/api", "/login", "/register"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
