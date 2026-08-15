import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Ticket,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Shorter label for the mobile tab bar, where five items share the width. */
  short: string;
  icon: LucideIcon;
};

/**
 * Five destinations, deliberately. The bottom tab bar on phones can hold five
 * before the labels start truncating, so the sidebar keeps the same set —
 * one navigation model, two shapes.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", short: "Home", icon: LayoutDashboard },
  { href: "/dashboard/classes", label: "Class timetable", short: "Classes", icon: CalendarDays },
  { href: "/dashboard/bookings", label: "My bookings", short: "Bookings", icon: Ticket },
  { href: "/dashboard/billing", label: "Plan & billing", short: "Billing", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile", short: "Profile", icon: UserRound },
];

/** `/dashboard` only matches exactly; everything else matches its subtree. */
export function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}
