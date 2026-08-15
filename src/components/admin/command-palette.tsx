"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command, CornerDownLeft, Search } from "lucide-react";

import { ADMIN_NAV } from "@/components/admin/nav";
import { cn } from "@/lib/utils";

type Entry = { href: string; label: string; group: string; hint: string };

const ENTRIES: Entry[] = [
  ...ADMIN_NAV.flatMap((group) =>
    group.items.map((item) => ({
      href: item.href,
      label: item.label,
      group: group.label,
      hint: item.blurb,
    })),
  ),
  { href: "/admin/plans?new=1", label: "New plan", group: "Create", hint: "Add a membership tier." },
  {
    href: "/admin/trainers?new=1",
    label: "New coach",
    group: "Create",
    hint: "Add someone to the roster.",
  },
  {
    href: "/admin/classes?new=1",
    label: "New class",
    group: "Create",
    hint: "Put a session on the timetable.",
  },
  {
    href: "/admin/payments?status=FAILED",
    label: "Failed payments",
    group: "Jump to",
    hint: "Cards that were declined.",
  },
  {
    href: "/admin/leads?state=open",
    label: "Unhandled enquiries",
    group: "Jump to",
    hint: "People still waiting on a reply.",
  },
  { href: "/dashboard", label: "Member dashboard", group: "Leave", hint: "See the member view." },
  { href: "/", label: "Public site", group: "Leave", hint: "The marketing site." },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setCursor(0);
    }
  }, [open]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ENTRIES;
    return ENTRIES.filter((entry) =>
      `${entry.label} ${entry.group} ${entry.hint}`.toLowerCase().includes(q),
    );
  }, [query]);

  React.useEffect(() => setCursor(0), [query]);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex h-10 min-w-0 items-center gap-2 rounded-xl border border-border bg-surface px-3",
          "text-sm text-ink-faint transition-colors hover:border-brand hover:text-ink",
          "lg:w-72",
        )}
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden truncate lg:inline">Search or jump to…</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-border px-1.5 py-0.5 font-sans text-[10px] tracking-wide text-ink-faint lg:inline-flex">
          <Command className="size-2.5" aria-hidden />K
        </kbd>
        <span className="sr-only">Open the command palette</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh]">
          <button
            type="button"
            aria-label="Close command palette"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="relative mx-4 w-full max-w-xl overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setCursor((c) => Math.min(c + 1, results.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setCursor((c) => Math.max(c - 1, 0));
                  } else if (e.key === "Enter" && results[cursor]) {
                    e.preventDefault();
                    go(results[cursor].href);
                  }
                }}
                placeholder="Members, plans, failed payments…"
                aria-label="Search the admin portal"
                aria-controls="command-results"
                className="h-14 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
              />
              <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-sans text-[10px] text-ink-faint sm:block">
                esc
              </kbd>
            </div>

            <ul ref={listRef} id="command-results" className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-ink-faint">
                  Nothing matches “{query}”.
                </li>
              )}
              {results.map((entry, i) => (
                <li key={entry.href + entry.label}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(entry.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      i === cursor ? "bg-brand-soft" : "hover:bg-bg-subtle",
                    )}
                  >
                    <span className="w-[70px] shrink-0 text-[10px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                      {entry.group}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm font-medium",
                          i === cursor ? "text-brand" : "text-ink",
                        )}
                      >
                        {entry.label}
                      </span>
                      <span className="block truncate text-xs text-ink-faint">{entry.hint}</span>
                    </span>
                    {i === cursor && (
                      <CornerDownLeft className="size-3.5 shrink-0 text-brand" aria-hidden />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
