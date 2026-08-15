import { getSession } from "@/lib/auth";
import { HeaderNav } from "./header-nav";

/**
 * Server half of the header: reads the session cookie so the CTA can swap to
 * "Dashboard" without a client-side auth round trip.
 */
export async function SiteHeader() {
  const session = await getSession();

  return <HeaderNav session={session ? { name: session.name, role: session.role } : null} />;
}
