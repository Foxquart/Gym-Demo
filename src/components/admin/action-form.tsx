"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import type { ActionState } from "@/app/actions/admin";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/* ------------------------- field-error plumbing --------------------------- */

const ErrorContext = React.createContext<Record<string, string> | undefined>(undefined);

/** Read the server-side error for one field name, if there is one. */
export function useFieldError(name: string) {
  return React.useContext(ErrorContext)?.[name];
}

/* --------------------------------- form ----------------------------------- */

export function ActionForm({
  action,
  children,
  className,
  onSuccess,
  successToast = true,
  id,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  onSuccess?: (state: NonNullable<ActionState>) => void;
  successToast?: boolean;
  id?: string;
}) {
  const [state, formAction] = React.useActionState<ActionState, FormData>(action, null);
  const seen = React.useRef<ActionState>(null);

  React.useEffect(() => {
    if (!state || state === seen.current) return;
    seen.current = state;
    if (state.ok) {
      if (successToast) toast.success(state.message);
      onSuccess?.(state);
    } else {
      // Long "why not" explanations (deletion blocks) need dwell time.
      toast.error(state.message, { duration: state.message.length > 90 ? 9000 : 5000 });
    }
  }, [state, onSuccess, successToast]);

  return (
    <ErrorContext.Provider value={state?.errors}>
      <form id={id} action={formAction} className={className} noValidate>
        {state && !state.ok && state.errors?.form ? (
          <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.errors.form}
          </p>
        ) : null}
        {children}
      </form>
    </ErrorContext.Provider>
  );
}

/* ------------------------------ submit button ----------------------------- */

export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...props}>
      {children}
    </Button>
  );
}

/**
 * A one-click server action rendered as its own tiny form — used for toggles,
 * reorder arrows and status flips inside table rows.
 */
export function ActionButton({
  action,
  fields,
  children,
  className,
  variant = "ghost",
  size = "sm",
  title,
  "aria-label": ariaLabel,
}: {
  action: Action;
  fields: Record<string, string | number>;
  children: React.ReactNode;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  title?: string;
  "aria-label"?: string;
}) {
  return (
    <ActionForm action={action} className="contents">
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={String(value)} />
      ))}
      <SubmitButton variant={variant} size={size} className={className} title={title} aria-label={ariaLabel}>
        {children}
      </SubmitButton>
    </ActionForm>
  );
}

/* --------------------------------- toggle --------------------------------- */

export function Switch({
  name,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  hint?: string;
}) {
  const [on, setOn] = React.useState(Boolean(defaultChecked));
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border",
        "bg-bg-subtle/60 px-3 py-2 transition-colors hover:border-border-strong",
      )}
    >
      <span className="flex flex-col">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </span>
      <input
        type="checkbox"
        name={name}
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
          on ? "bg-brand" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-surface-raised shadow-[var(--shadow-sm)]",
            "transition-transform duration-200 ease-[var(--ease-out-expo)]",
            on && "translate-x-5",
          )}
        />
      </span>
    </label>
  );
}
