import {
  CalendarDays,
  CreditCard,
  Dumbbell,
  Inbox,
  LayoutDashboard,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Shown in the top bar when this route is active. */
  title: string;
  blurb: string;
  icon: LucideIcon;
  /** Only the exact path counts as active (the index route). */
  exact?: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Command centre",
        title: "Command centre",
        blurb: "Everything worth knowing before the 6am class.",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        href: "/admin/members",
        label: "Members",
        title: "Members",
        blurb: "Everyone on the books, and what they're paying for.",
        icon: Users,
      },
      {
        href: "/admin/leads",
        label: "Enquiries",
        title: "Enquiries",
        blurb: "People who filled in the contact form and are waiting on you.",
        icon: Inbox,
      },
    ],
  },
  {
    label: "The floor",
    items: [
      {
        href: "/admin/classes",
        label: "Timetable",
        title: "Timetable",
        blurb: "Sessions, coaches on them, and who's booked in.",
        icon: CalendarDays,
      },
      {
        href: "/admin/trainers",
        label: "Coaches",
        title: "Coaches",
        blurb: "The people members trust with their knees.",
        icon: Dumbbell,
      },
    ],
  },
  {
    label: "Money",
    items: [
      {
        href: "/admin/plans",
        label: "Plans",
        title: "Membership plans",
        blurb: "What we charge, what's included, and what's on the pricing page.",
        icon: Tags,
      },
      {
        href: "/admin/payments",
        label: "Payments",
        title: "Payment ledger",
        blurb: "Every Razorpay order, paid, pending or declined.",
        icon: CreditCard,
      },
    ],
  },
];

export const ADMIN_NAV_FLAT = ADMIN_NAV.flatMap((group) => group.items);

export function isActive(item: NavItem, pathname: string) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function activeItem(pathname: string) {
  // Longest matching href wins, so /admin/members/[id] resolves to Members.
  return (
    [...ADMIN_NAV_FLAT]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isActive(item, pathname)) ?? ADMIN_NAV_FLAT[0]
  );
}
