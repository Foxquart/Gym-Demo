import * as React from "react";

import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { SmoothScroll } from "./smooth-scroll";

/**
 * The marketing chrome: Lenis + header + footer. Used by `/` and by the
 * `(marketing)` route group layout — never by the app shells, which scroll
 * natively.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:rounded-full focus:bg-brand focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-brand-ink"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </SmoothScroll>
  );
}
