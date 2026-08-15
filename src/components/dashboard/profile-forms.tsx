"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui";
import { changePassword, updateProfile, type AuthState } from "@/app/actions/auth";
import { initials } from "@/lib/utils";

const EMPTY: AuthState = {};

function useToastOnResult(state: AuthState) {
  React.useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);
}

function Alert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-[13px] leading-snug text-danger"
    >
      <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

/* -------------------------------- Details --------------------------------- */

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string; phone: string | null; goal: string | null; avatarUrl: string | null };
}) {
  const [state, formAction, pending] = useActionState(updateProfile, EMPTY);
  const [avatar, setAvatar] = React.useState(user.avatarUrl ?? "");
  const [name, setName] = React.useState(user.name);
  useToastOnResult(state);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {!state.ok ? <Alert message={state.message} /> : null}

      <div className="flex items-center gap-4 rounded-xl border border-border bg-bg-subtle p-3.5">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            className="size-14 shrink-0 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        ) : (
          <span
            aria-hidden
            className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-soft font-display text-lg text-brand"
          >
            {initials(name || user.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{name || user.name}</p>
          <p className="truncate text-xs text-ink-faint">{user.email}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Email is your login and can&rsquo;t be changed here. Ask the desk if it needs moving.
          </p>
        </div>
      </div>

      <Field label="Full name" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={errors.name ? true : undefined}
        />
      </Field>

      <Field
        label="Phone"
        htmlFor="phone"
        hint="Used only when a class you booked moves or gets cancelled."
        error={errors.phone}
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={user.phone ?? ""}
          placeholder="+91 98111 44556"
          aria-invalid={errors.phone ? true : undefined}
        />
      </Field>

      <Field
        label="Training goal"
        htmlFor="goal"
        hint="Specific beats poetic. Your coach reads this before every review."
        error={errors.goal}
      >
        <Textarea
          id="goal"
          name="goal"
          rows={3}
          maxLength={140}
          defaultValue={user.goal ?? ""}
          placeholder="Pull a double-bodyweight deadlift by December."
          className="min-h-20"
          aria-invalid={errors.goal ? true : undefined}
        />
      </Field>

      <Field
        label="Avatar URL"
        htmlFor="avatarUrl"
        hint="Any image link. Leave it empty and we'll use your initials."
        error={errors.avatarUrl}
      >
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          inputMode="url"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://images.unsplash.com/photo-..."
          aria-invalid={errors.avatarUrl ? true : undefined}
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={pending}>
          {pending ? "Saving" : "Save changes"}
        </Button>
        {state.ok ? (
          <span className="text-[13px] text-success" role="status">
            Saved.
          </span>
        ) : null}
      </div>
    </form>
  );
}

/* -------------------------------- Password -------------------------------- */

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, EMPTY);
  const formRef = React.useRef<HTMLFormElement>(null);
  useToastOnResult(state);

  React.useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  const errors = state.fieldErrors ?? {};

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4" noValidate>
      {!state.ok ? <Alert message={state.message} /> : null}

      <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword}>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={errors.currentPassword ? true : undefined}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="New password"
          htmlFor="newPassword"
          hint={errors.newPassword ? undefined : "Eight characters or more."}
          error={errors.newPassword}
        >
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={errors.newPassword ? true : undefined}
          />
        </Field>

        <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={errors.confirmPassword ? true : undefined}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="outline" loading={pending}>
          {pending ? "Updating" : "Change password"}
        </Button>
        {state.ok ? (
          <span className="text-[13px] text-success" role="status">
            Updated.
          </span>
        ) : null}
      </div>
    </form>
  );
}
