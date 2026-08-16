import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileTabBar, MobileTopBar } from "@/components/dashboard/mobile-nav";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Ember" },
};

/**
 * The member app shell.
 *
 * `lg:` and up — a fixed 17.5rem rail with the content column taking every
 * remaining pixel of the viewport. Below that the rail becomes a sticky top
 * bar plus a bottom tab bar, which is where thumbs actually are.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const chip = { name: user.name, email: user.email, avatarUrl: user.avatarUrl };

  return (
    <div className="min-h-dvh bg-bg">
      <a
        href="#member-main"
        className="sr-only rounded-full bg-brand px-4 py-2 text-sm text-brand-ink focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>

      <Sidebar user={chip} />

      <div className="lg:pl-[17.5rem]">
        <MobileTopBar user={chip} />

        <main
          id="member-main"
          className="px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-9 lg:pb-16 xl:px-10 2xl:px-14 page-enter"
        >
          {children}
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}
