import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/shell";
import { CHART_TOKENS_CSS } from "@/components/admin/chart-tokens";

export const metadata: Metadata = {
  title: { default: "Operations", template: "%s · Ember Operations" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div data-ember-charts>
      {/* Chart tokens live here rather than in globals.css: they are only ever
          used by the admin portal, and they need their own light/dark steps. */}
      <style dangerouslySetInnerHTML={{ __html: CHART_TOKENS_CSS }} />
      <AdminShell user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl }}>
        {children}
      </AdminShell>
    </div>
  );
}
