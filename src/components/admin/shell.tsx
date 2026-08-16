"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, LogOut, Menu, PanelLeftClose, X } from "lucide-react";

import { ThemeToggle } from "@/components/theme";
import { CommandPalette } from "@/components/admin/command-palette";
import { ADMIN_NAV, activeItem, isActive } from "@/components/admin/nav";
import { cn, initials } from "@/lib/utils";

type AdminUser = { name: string; email: string; avatarUrl: string | null };

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const current = activeItem(pathname);

  // Navigating closes the phone drawer; leaving it open over the new page is
  // the classic mobile-nav bug.
  React.useEffect(() => setDrawer(false), [pathname]);

  React.useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <div className="flex min-h-dvh w-full bg-bg">
      {/* ------------------------------ sidebar ------------------------------ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[16.5rem] flex-col border-r border-border bg-surface",
          "transition-transform duration-300 ease-[var(--ease-out-expo)] lg:translate-x-0",
          "lg:transition-[width]",
          drawer ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[4.5rem]",
        )}
        aria-label="Admin sections"
      >
        <SidebarBody
          user={user}
          pathname={pathname}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onCloseDrawer={() => setDrawer(false)}
        />
      </aside>

      {drawer && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setDrawer(false)}
          className="fixed inset-0 z-40 bg-[var(--overlay)] lg:hidden"
        />
      )}

      {/* ------------------------------- content ----------------------------- */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-[var(--ease-out-expo)]",
          collapsed ? "lg:pl-[4.5rem]" : "lg:pl-[16.5rem]",
        )}
      >
        <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open navigation"
              aria-expanded={drawer}
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-border text-ink-muted lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg leading-tight tracking-tight text-ink sm:text-xl">
                {current.title}
              </h1>
              <p className="hidden truncate text-xs text-ink-faint sm:block">{current.blurb}</p>
            </div>

            <CommandPalette />
            <ThemeToggle className="hidden shrink-0 sm:grid" />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 page-enter">{children}</main>
      </div>
    </div>
  );
}

function SidebarBody({
  user,
  pathname,
  collapsed,
  onToggleCollapse,
  onCloseDrawer,
}: {
  user: AdminUser;
  pathname: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCloseDrawer: () => void;
}) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Link
          href="/admin"
          className="flex min-w-0 items-center gap-2.5 text-ink"
          aria-label="Ember Athletic Club admin"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink">
            <Flame className="size-[18px]" aria-hidden />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] leading-none tracking-tight">
                Ember
              </span>
              <span className="block truncate text-[10px] tracking-[0.18em] text-ink-faint uppercase">
                Operations
              </span>
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto hidden size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-bg-subtle hover:text-ink lg:grid"
        >
          <PanelLeftClose
            className={cn("size-4 transition-transform duration-300", collapsed && "rotate-180")}
          />
        </button>
        <button
          type="button"
          onClick={onCloseDrawer}
          aria-label="Close navigation"
          className="ml-auto grid size-11 place-items-center rounded-lg text-ink-faint lg:hidden"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.18em] text-ink-faint uppercase">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors duration-200",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-brand-soft font-medium text-brand"
                          : "text-ink-muted hover:bg-bg-subtle hover:text-ink",
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand"
                        />
                      )}
                      <Icon className="size-[18px] shrink-0" aria-hidden />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <div className={cn("flex items-center gap-2.5 rounded-xl p-2", collapsed && "justify-center p-0")}>
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-bg-subtle text-[11px] font-semibold text-ink-muted">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initials(user.name)
            )}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{user.name}</span>
              <span className="block truncate text-[11px] text-ink-faint">{user.email}</span>
            </span>
          )}
          {!collapsed && <ThemeToggle className="size-9 sm:hidden" />}
        </div>
        {!collapsed && (
          <Link
            href="/dashboard"
            className="mt-1 flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-[13px] text-ink-faint transition-colors hover:bg-bg-subtle hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden />
            Back to the member view
          </Link>
        )}
      </div>
    </>
  );
}
