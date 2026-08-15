import Link from "next/link";
import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Ember Athletic Club — home"
      className={cn("group inline-flex shrink-0 items-center gap-2.5", className)}
    >
      <span className="grid size-9 place-items-center rounded-[12px] bg-brand text-brand-ink shadow-[var(--shadow-sm)] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-rotate-12">
        <Flame className="size-[18px]" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="font-display text-[17px] leading-none font-extrabold tracking-[-0.045em] text-ink uppercase">
        Ember
        <span className="text-brand">.</span>
      </span>
    </Link>
  );
}
