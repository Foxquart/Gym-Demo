"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

/** Rewrites the query string without losing the rest of it. */
function useQueryPatch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return React.useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") params.delete(key);
        else params.set(key, value);
      }
      // Any filter change invalidates the current page number.
      if (!("page" in patch)) params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );
}

export function SearchField({
  placeholder,
  paramName = "q",
  className,
  label,
}: {
  placeholder: string;
  paramName?: string;
  className?: string;
  label: string;
}) {
  const searchParams = useSearchParams();
  const patch = useQueryPatch();
  const initial = searchParams.get(paramName) ?? "";
  const [value, setValue] = React.useState(initial);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const id = React.useId();

  // Keep in step when the URL changes from elsewhere (back button, nav).
  React.useEffect(() => setValue(initial), [initial]);

  // Debounced so every keystroke isn't a round trip.
  React.useEffect(() => {
    if (value === initial) return;
    const t = setTimeout(() => patch({ [paramName]: value || undefined }), 300);
    return () => clearTimeout(t);
  }, [value, initial, patch, paramName]);

  // "/" focuses search from anywhere — the operator shortcut people expect.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint"
      />
      <input
        id={id}
        ref={inputRef}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setValue("");
            inputRef.current?.blur();
          }
        }}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-surface pr-10 pl-10 text-sm text-ink",
          "placeholder:text-ink-faint outline-none transition-colors",
          "focus:border-brand focus:ring-2 focus:ring-[var(--ring)]",
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-faint hover:text-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function FilterSelect({
  paramName,
  label,
  options,
  className,
}: {
  paramName: string;
  label: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const searchParams = useSearchParams();
  const patch = useQueryPatch();
  const value = searchParams.get(paramName) ?? "";
  const id = React.useId();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => patch({ [paramName]: e.target.value || undefined })}
        className={cn(
          "h-11 cursor-pointer rounded-xl border border-border bg-surface px-3 pr-8 text-sm text-ink",
          "outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-[var(--ring)]",
          value && "border-brand/60 text-brand",
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DateRangeFilter({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const patch = useQueryPatch();
  const fromId = React.useId();
  const toId = React.useId();

  const field =
    "h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink outline-none " +
    "transition-colors focus:border-brand focus:ring-2 focus:ring-[var(--ring)]";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor={fromId} className="text-xs whitespace-nowrap text-ink-faint">
        From
      </label>
      <input
        id={fromId}
        type="date"
        defaultValue={searchParams.get("from") ?? ""}
        onChange={(e) => patch({ from: e.target.value || undefined })}
        className={field}
      />
      <label htmlFor={toId} className="text-xs whitespace-nowrap text-ink-faint">
        To
      </label>
      <input
        id={toId}
        type="date"
        defaultValue={searchParams.get("to") ?? ""}
        onChange={(e) => patch({ to: e.target.value || undefined })}
        className={field}
      />
    </div>
  );
}

/** Row of controls above every table — one line on desktop, wraps on phones. */
export function Toolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
