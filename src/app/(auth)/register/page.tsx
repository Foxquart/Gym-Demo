import type { Metadata } from "next";

import { RegisterForm } from "../auth-forms";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Start your Ember Athletic Club membership. Pick a plan after you sign up.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const target = Array.isArray(next) ? next[0] : next;
  const safe = target && target.startsWith("/") && !target.startsWith("//") ? target : undefined;

  return <RegisterForm next={safe} />;
}
