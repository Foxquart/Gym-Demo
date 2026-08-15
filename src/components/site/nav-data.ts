export type NavLink = { href: string; label: string; note: string };

/** Single source of truth for the marketing nav — header, mobile menu, footer. */
export const NAV_LINKS: NavLink[] = [
  { href: "/classes", label: "Classes", note: "Ten hours a week, capped small" },
  { href: "/trainers", label: "Coaches", note: "Four people who watch every rep" },
  { href: "/pricing", label: "Membership", note: "Three plans, no joining fee" },
  { href: "/contact", label: "Visit", note: "Bandra West · Indiranagar" },
];

export const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://youtube.com", label: "YouTube" },
  { href: "https://www.strava.com", label: "Strava" },
];

export const LEGAL_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/pricing", label: "Membership terms" },
  { href: "/contact", label: "Privacy" },
];

export const LOCATIONS = [
  {
    name: "Ember Bandra",
    address: "3rd floor, Pali Naka, Bandra West, Mumbai 400050",
    hours: "Mon–Fri 5:00–23:00 · Sat–Sun 6:00–20:00",
    phone: "+91 22 4890 1120",
  },
  {
    name: "Ember Indiranagar",
    address: "12th Main, Indiranagar, Bengaluru 560038",
    hours: "Mon–Fri 5:30–22:30 · Sat–Sun 6:30–19:00",
    phone: "+91 80 4890 1121",
  },
];
