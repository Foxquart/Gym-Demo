import Link from "next/link";
import { Flame, Lock } from "lucide-react";

import { ThemeToggle } from "@/components/theme";
import { TestModeBadge } from "@/components/checkout/test-mode-badge";

/** Slim, distraction-free chrome — checkout is not the place for a nav menu. */
export function CheckoutHeader({ mode }: { mode: "live" | "mock" }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border glass">
      <div className="container-edge flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-80"
        >
          <span className="grid size-9 place-items-center rounded-full bg-brand text-brand-ink">
            <Flame className="size-[18px]" aria-hidden />
          </span>
          <span className="font-display text-[15px] leading-none tracking-tight">
            Ember Athletic Club
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-1.5 text-[12px] text-ink-faint sm:inline-flex">
            <Lock className="size-3.5" aria-hidden />
            Secure checkout
          </span>
          <TestModeBadge mode={mode} />
          <ThemeToggle className="size-9" />
        </div>
      </div>
    </header>
  );
}
