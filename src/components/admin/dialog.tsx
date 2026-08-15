"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import type { ActionState } from "@/app/actions/admin";

/* --------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  // Escape closes, and the body stops scrolling behind the sheet.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the first control so keyboard users land inside the dialog.
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input:not([type=hidden]), select, textarea, button",
    );
    first?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden border border-border bg-surface",
          "rounded-t-[var(--radius-card)] shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-card)]",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-2xl",
          size === "lg" && "sm:max-w-4xl",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-lg tracking-tight text-ink">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-11 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-bg-subtle hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------- Confirm action ----------------------------- */

/**
 * Destructive actions never fire on the first click. This renders a trigger,
 * then a dialog that spells out the consequence before the action runs.
 */
export function ConfirmAction({
  action,
  fields,
  trigger,
  title,
  body,
  confirmLabel = "Delete",
  requireTyping,
  onDone,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string | number>;
  trigger: React.ReactElement<{ onClick?: () => void }>;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  /** When set, the admin must type this word (e.g. DELETE) to arm the button. */
  requireTyping?: string;
  onDone?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const armed = !requireTyping || typed === requireTyping;

  return (
    <>
      {React.cloneElement(trigger, { onClick: () => setOpen(true) })}
      <Modal open={open} onClose={() => setOpen(false)} title={title} size="sm">
        <div className="space-y-4 text-sm leading-relaxed text-ink-muted">{body}</div>
        <ActionForm
          action={action}
          className="mt-5 space-y-4"
          onSuccess={() => {
            setOpen(false);
            setTyped("");
            onDone?.();
          }}
        >
          {Object.entries(fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={String(value)} />
          ))}
          {requireTyping && (
            <label className="block">
              <span className="text-[13px] font-medium text-ink-muted">
                Type <span className="font-mono text-danger">{requireTyping}</span> to confirm
              </span>
              <input
                name="confirm"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 font-mono text-sm text-ink outline-none focus:border-danger focus:ring-2 focus:ring-danger/40"
              />
            </label>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <SubmitButton variant="danger" disabled={!armed}>
              {confirmLabel}
            </SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}

/* ------------------------- Trigger + form dialog -------------------------- */

/** A button that opens a modal containing arbitrary form content. */
export function DialogButton({
  label,
  title,
  description,
  children,
  variant = "primary",
  size = "sm",
  icon,
  className,
  dialogSize = "md",
  defaultOpen = false,
}: {
  label: string;
  title: string;
  description?: string;
  children: (close: () => void) => React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  icon?: React.ReactNode;
  className?: string;
  dialogSize?: "sm" | "md" | "lg";
  /** Opens on mount — used by the `?new=1` deep link from the command palette. */
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {icon}
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        size={dialogSize}
      >
        {children(() => setOpen(false))}
      </Modal>
    </>
  );
}
