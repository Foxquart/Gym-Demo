import { MarketingShell } from "@/components/site/marketing-shell";

/**
 * Every route in this group gets the marketing chrome: Lenis smooth scroll,
 * the glass header and the big footer. `/` composes the same shell directly
 * because it lives outside the group.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
