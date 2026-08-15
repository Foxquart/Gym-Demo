"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui";
import { initialLeadState, submitLead } from "@/app/actions/leads";

export function LeadForm({ compact = false }: { compact?: boolean }) {
  const [state, formAction, pending] = useActionState(submitLead, initialLeadState);
  const formRef = React.useRef<HTMLFormElement>(null);
  const lastStatus = React.useRef(state.status);

  React.useEffect(() => {
    if (state.status === lastStatus.current) return;
    lastStatus.current = state.status;
    if (state.status === "success") {
      toast.success(state.message ?? "Thanks — we will be in touch.");
      formRef.current?.reset();
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-4"
      aria-describedby="lead-form-status"
    >
      <div className={compact ? "flex flex-col gap-4" : "grid gap-4 sm:grid-cols-2"}>
        <Field label="Name" htmlFor="lead-name" error={state.errors?.name}>
          <Input
            id="lead-name"
            name="name"
            autoComplete="name"
            required
            placeholder="Arjun Nair"
            aria-invalid={Boolean(state.errors?.name)}
          />
        </Field>
        <Field label="Email" htmlFor="lead-email" error={state.errors?.email}>
          <Input
            id="lead-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            aria-invalid={Boolean(state.errors?.email)}
          />
        </Field>
      </div>

      <Field
        label="Phone"
        htmlFor="lead-phone"
        hint="Optional — quickest way to book your free week."
        error={state.errors?.phone}
      >
        <Input
          id="lead-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98200 11223"
          aria-invalid={Boolean(state.errors?.phone)}
        />
      </Field>

      <Field
        label="What are you after?"
        htmlFor="lead-message"
        error={state.errors?.message}
      >
        <Textarea
          id="lead-message"
          name="message"
          required
          rows={4}
          placeholder="I have lifted on and off for years and want someone to fix my deadlift. Weekday evenings work best."
          aria-invalid={Boolean(state.errors?.message)}
        />
      </Field>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="hidden">
        <label htmlFor="lead-company">Company</label>
        <input id="lead-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
          {pending ? "Sending…" : "Book my free week"}
        </Button>
        <p className="text-xs leading-relaxed text-ink-faint">
          One reply from a coach. No newsletter, no drip sequence.
        </p>
      </div>

      <p
        id="lead-form-status"
        role="status"
        aria-live="polite"
        className={
          state.status === "success"
            ? "flex items-center gap-2 text-sm text-success"
            : state.status === "error"
              ? "text-sm text-danger"
              : "sr-only"
        }
      >
        {state.status === "success" && <CheckCircle2 className="size-4 shrink-0" aria-hidden />}
        {state.status === "idle" ? "" : state.message}
      </p>
    </form>
  );
}
