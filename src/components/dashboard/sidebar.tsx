"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";

import { ThemeToggle } from "@/components/theme";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav";
import { UserChip, type ChipUser } from "./user-chip";

/**
 * Fixed rail from `lg:` up. It owns the left 17.5rem of the viewport so the
 * content column can run the full remaining width — no centred max-w-5xl.
 */
export function Sidebar({ user }: { user: ChipUser }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17.5rem] flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-[4.5rem] items-center px-5">
        <Link href="/" className="group inline-flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-brand text-brand-ink transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-105">
            <Flame className="size-[18px]" aria-hidden />
          </span>
          <span className="font-display text-[17px] leading-none tracking-tight text-ink">
            Ember
            <span className="mt-1 block text-[10px] font-medium tracking-[0.2em] text-ink-faint uppercase">
              Athletic Club
            </span>
          </span>
        </Link>
      </div>

      <nav aria-label="Member area" className="flex-1 overflow-y-auto px-3 py-2">
        <p className="px-3 pt-2 pb-2 text-[10px] font-semibold tracking-[0.2em] text-ink-faint uppercase">
          Your training
        </p>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors duration-200",
                    active
                      ? "bg-brand-soft font-medium text-brand"
                      : "text-ink-muted hover:bg-bg-subtle hover:text-ink",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand transition-transform duration-300 ease-[var(--ease-out-expo)]",
                      active ? "scale-y-100" : "scale-y-0",
                    )}
                  />
                  <item.icon className="size-[18px] shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-3 border-t border-border p-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-[11px] text-ink-faint">Appearance</span>
          <ThemeToggle />
        </div>
        <UserChip user={user} />
      </div>
    </aside>
  );
}
