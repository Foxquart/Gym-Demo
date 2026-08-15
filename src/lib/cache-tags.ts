/**
 * Cache tags shared between the cached marketing reads and the admin
 * mutations that invalidate them. Kept in one place so a new tag can never
 * drift between the reader and the writer.
 */
export const CACHE_TAGS = {
  plans: "plans",
  trainers: "trainers",
  classes: "classes",
  testimonials: "testimonials",
  stats: "stats",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
