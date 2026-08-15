import type { Metadata } from "next";

import { LoginForm } from "../auth-forms";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Ember Athletic Club membership.",
};

/** `?next=` is set by the middleware when it bounces a signed-out request. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const target = Array.isArray(next) ? next[0] : next;
  const safe = target && target.startsWith("/") && !target.startsWith("//") ? target : undefined;

  return <LoginForm next={safe} />;
}
