"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";

const EMPTY: AuthState = {};

/* ------------------------------- Primitives ------------------------------- */

function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-[13px] leading-snug text-danger"
    >
      <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

function PasswordInput({
  id,
  name,
  autoComplete,
  value,
  onChange,
  invalid,
  placeholder,
}: {
  id: string;
  name: string;
  autoComplete: string;
  value?: string;
  onChange?: (v: string) => void;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [shown, setShown] = React.useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="pr-12"
        aria-invalid={invalid || undefined}
        {...(onChange ? { value: value ?? "", onChange: (e) => onChange(e.target.value) } : {})}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-ink-faint transition-colors duration-200 hover:text-ink"
      >
        {shown ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
      </button>
    </div>
  );
}

function AuthHeading({ title, lede }: { title: string; lede: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-display-sm text-ink">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{lede}</p>
    </div>
  );
}

/* --------------------------------- Login ---------------------------------- */

const DEMOS = [
  {
    key: "member",
    label: "Member",
    hint: "Arjun Nair · Forge plan",
    email: "member@ember.club",
    icon: UserRound,
  },
  {
    key: "admin",
    label: "Admin",
    hint: "Maya Rathore · front desk",
    email: "admin@ember.club",
    icon: ShieldCheck,
  },
] as const;

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, EMPTY);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [filled, setFilled] = React.useState<string | null>(null);

  function fillDemo(demoEmail: string, key: string) {
    setEmail(demoEmail);
    setPassword("password123");
    setFilled(key);
  }

  const errors = state.fieldErrors ?? {};

  return (
    <>
      <AuthHeading
        title="Welcome back."
        lede="Sign in to see your week, book a class, or check what the bar owes you."
      />

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <FormAlert message={state.message} />

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            invalid={Boolean(errors.password)}
          />
        </Field>

        <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
          {pending ? "Signing you in" : "Sign in"}
        </Button>
      </form>

      {/* --------------------------- Demo accounts --------------------------- */}
      <div className="mt-8">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" aria-hidden />
          <span className="text-[11px] font-semibold tracking-[0.18em] text-ink-faint uppercase">
            Just looking around?
          </span>
          <span className="h-px flex-1 bg-border" aria-hidden />
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {DEMOS.map((demo) => (
            <button
              key={demo.key}
              type="button"
              onClick={() => fillDemo(demo.email, demo.key)}
              className="group flex min-h-[44px] items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-left transition-colors duration-200 hover:border-brand hover:bg-brand-soft"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-bg-subtle text-ink-muted transition-colors group-hover:bg-brand group-hover:text-brand-ink">
                <demo.icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-ink">
                  Use the {demo.label.toLowerCase()} demo
                </span>
                <span className="block truncate text-[11px] text-ink-faint">
                  {filled === demo.key ? "Filled in — hit sign in" : demo.hint}
                </span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-ink-faint">
          Both demo logins use the password <code className="font-mono text-ink-muted">password123</code>. Nothing you
          do on them is permanent.
        </p>
      </div>

      <p className="mt-8 text-sm text-ink-muted">
        No membership yet?{" "}
        <Link href="/register" className="font-medium text-brand underline-offset-4 hover:underline">
          Start one — it takes a minute
        </Link>
      </p>
    </>
  );
}

/* -------------------------------- Register -------------------------------- */

export function RegisterForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(registerAction, EMPTY);
  const errors = state.fieldErrors ?? {};

  return (
    <>
      <AuthHeading
        title="Join the club."
        lede="Create your account first. You'll pick a plan on the next screen — nothing is charged until you do."
      />

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <FormAlert message={state.message} />

        <Field label="Full name" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Arjun Nair"
            required
            aria-invalid={errors.name ? true : undefined}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-invalid={errors.email ? true : undefined}
          />
        </Field>

        <Field
          label="Phone"
          htmlFor="phone"
          hint="Optional. Only used when a class you booked gets moved."
          error={errors.phone}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 98111 44556"
            aria-invalid={errors.phone ? true : undefined}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Password"
            htmlFor="password"
            hint={errors.password ? undefined : "Eight characters or more."}
            error={errors.password}
          >
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
            />
          </Field>

          <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              invalid={Boolean(errors.confirmPassword)}
            />
          </Field>
        </div>

        <Field
          label="What are you training for?"
          htmlFor="goal"
          hint="Optional, and easy to change. Your coach reads it before your first session."
          error={errors.goal}
        >
          <Textarea
            id="goal"
            name="goal"
            rows={3}
            maxLength={140}
            placeholder="Pull a double-bodyweight deadlift by December."
            className="min-h-20"
            aria-invalid={errors.goal ? true : undefined}
          />
        </Field>

        <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
          {pending ? "Setting things up" : "Create my account"}
        </Button>

        <p className="text-xs leading-relaxed text-ink-faint">
          By joining you agree to the club rules: rerack your plates, wipe the bench, and tell a coach
          when something hurts.
        </p>
      </form>

      <p className="mt-8 text-sm text-ink-muted">
        Already a member?{" "}
        <Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
