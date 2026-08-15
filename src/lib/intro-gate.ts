"use client";

/**
 * A one-shot latch between the intro overlay and the hero entrance.
 *
 * The hero's own timeline must not burn its stagger while a full-screen
 * overlay is covering it, so it waits on `introDone` and plays as the furnace
 * doors part.
 *
 * The failsafe matters more than the choreography: if the overlay throws, is
 * never mounted, or a plugin fails to load, this still resolves and the hero
 * animates normally. A broken intro must never leave a blank page behind.
 */

const FAILSAFE_MS = 4200;

let resolveDone: (() => void) | undefined;
let settled = false;

export const introDone: Promise<void> =
  typeof window === "undefined"
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        resolveDone = resolve;
      });

if (typeof window !== "undefined") {
  window.setTimeout(() => markIntroDone(), FAILSAFE_MS);
}

export function markIntroDone() {
  if (settled) return;
  settled = true;
  resolveDone?.();
}

export function introHasPlayed() {
  return settled;
}
