import "server-only";

import { NextResponse } from "next/server";

/** Uniform JSON envelope so the client never has to guess at a shape. */
export function ok<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function fail(error: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

/**
 * Turns anything thrown by the SDK or the network into one sentence a member can
 * read. The detail goes to the server log; the stack never crosses the wire.
 */
export function describeError(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const maybe = error as { error?: { description?: string }; message?: string };
    if (typeof maybe.error?.description === "string") return maybe.error.description;
    if (typeof maybe.message === "string" && maybe.message.length < 160) return maybe.message;
  }
  return fallback;
}
