"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";

import { ThemeToggle } from "@/components/theme";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav";
import { Avatar, type ChipUser } from "./user-chip";

/** Sticky header for phones and tablets — the sidebar's job below `lg:`. */
export function MobileTopBar({ user }: { user: ChipUser }) {
  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border px-4 sm:px-6 lg:hidden">
      <Link href="/" className="inline-flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-brand text-brand-ink">
          <Flame className="size-4" aria-hidden />
        </span>
        <span className="font-display text-[15px] tracking-tight text-ink">Ember</span>
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="/dashboard/profile"
          className="grid size-11 place-items-center rounded-full"
          aria-label={`Profile — signed in as ${user.name}`}
        >
          <Avatar user={user} />
        </Link>
      </div>
    </header>
  );
}

/**
 * Bottom tab bar. Thumb-reachable, five items, labels always visible, and it
 * sits above the home indicator via the safe-area inset.
 */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Member area"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 transition-colors duration-200",
                  active ? "text-brand" : "text-ink-faint",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-colors duration-200",
                    active && "bg-brand-soft",
                  )}
                >
                  <item.icon className="size-[19px]" aria-hidden />
                </span>
                <span className={cn("text-[10.5px] leading-none", active && "font-semibold")}>
                  {item.short}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
