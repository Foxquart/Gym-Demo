"use client";

import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { cn, initials } from "@/lib/utils";

export type ChipUser = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

export function Avatar({
  user,
  className,
}: {
  user: Pick<ChipUser, "name" | "avatarUrl">;
  className?: string;
}) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        className={cn("size-9 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand",
        className,
      )}
    >
      {initials(user.name)}
    </span>
  );
}

/** Sidebar footer: who you are, plus the way out. */
export function UserChip({ user }: { user: ChipUser }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg-subtle p-2.5">
      <Avatar user={user} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-medium text-ink">{user.name}</p>
        <p className="truncate text-[11px] text-ink-faint">{user.email}</p>
      </div>
      <LogoutButton />
    </div>
  );
}

export function LogoutButton({
  className,
  withLabel = false,
}: {
  className?: string;
  withLabel?: boolean;
}) {
  return (
    <form action={logoutAction} className={withLabel ? "w-full" : undefined}>
      <button
        type="submit"
        aria-label="Sign out"
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-ink-faint",
          "transition-colors duration-200 hover:bg-danger/10 hover:text-danger",
          withLabel ? "w-full px-4 text-sm font-medium" : "size-11 shrink-0",
          className,
        )}
      >
        <LogOut className="size-[18px]" aria-hidden />
        {withLabel ? "Sign out" : null}
      </button>
    </form>
  );
}
