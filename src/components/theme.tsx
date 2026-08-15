"use client";

import * as React from "react";
import { ThemeProvider as NextThemes, useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Theme is unknown until hydration; render a stable placeholder so the
  // server and client markup match.
  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative grid size-10 shrink-0 place-items-center rounded-full border border-border",
        "text-ink-muted transition-colors duration-300 hover:border-brand hover:text-brand",
        className,
      )}
    >
      <span
        className={cn(
          "absolute transition-all duration-500 ease-[var(--ease-out-expo)]",
          mounted && isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0",
        )}
      >
        <Sun className="size-[18px]" />
      </span>
      <span
        className={cn(
          "absolute transition-all duration-500 ease-[var(--ease-out-expo)]",
          mounted && !isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0",
        )}
      >
        <Moon className="size-[18px]" />
      </span>
    </button>
  );
}
