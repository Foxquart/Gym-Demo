"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small "what does this mean?" affordance.
 *
 * Deliberately not hover-only: on a phone there is no hover, so the trigger is
 * a real button that toggles on tap, opens on keyboard focus, and closes on
 * Escape or an outside tap. The bubble is linked with aria-describedby so a
 * screen reader announces the explanation with the number it belongs to.
 */
export function InfoTip({
  label,
  children,
  className,
  align = "end",
}: {
  /** Names the thing being explained, for screen readers: "What does X mean?" */
  label: string;
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  const wrapRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={`What does “${label}” mean?`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        // 44px hit area on touch without bloating the visual dot.
        className="grid size-4 place-items-center rounded-full text-ink-faint transition-colors duration-200 before:absolute before:-inset-3 before:content-[''] hover:text-brand focus-visible:text-brand"
      >
        <Info className="size-3.5" aria-hidden />
      </button>

      <span
        id={id}
        role="tooltip"
        hidden={!open}
        className={cn(
          "absolute bottom-full z-50 mb-2 w-56 rounded-xl border border-border bg-surface-raised p-3",
          "text-xs leading-relaxed font-normal tracking-normal text-ink-muted normal-case",
          "shadow-[var(--shadow-lg)]",
          align === "end" && "right-0",
          align === "start" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
        )}
      >
        {children}
      </span>
    </span>
  );
}
