/** Same stock-photo helper the seed uses, so art direction stays consistent. */
export const photo = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HERO_PHOTO = photo("1534438327276-14e5300c3a48", 1400);
export const MANIFESTO_PHOTO = photo("1517963879433-6ad2b056d712", 1000);

export const PILLAR_PHOTOS = {
  strength: photo("1571019613454-1cb2f99b2d8b", 900),
  conditioning: photo("1517836357463-d25dfeac3438", 900),
  mobility: photo("1518611012118-696072aa579a", 900),
  recovery: photo("1571019614242-c5c5dee9f50b", 900),
} as const;
