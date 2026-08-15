"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";

import { deletePlan, movePlan, savePlan, togglePlanActive } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui";
import {
  ActionButton,
  ActionForm,
  SubmitButton,
  Switch,
  useFieldError,
} from "@/components/admin/action-form";
import { ConfirmAction, DialogButton } from "@/components/admin/dialog";

export type PlanRecord = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  priceInPaise: number;
  interval: string;
  features: string[];
  highlight: boolean;
  active: boolean;
  sortOrder: number;
  subscriptionCount: number;
};

/* ------------------------------ field helper ------------------------------ */

function TextField({
  name,
  label,
  hint,
  defaultValue,
  placeholder,
  type = "text",
  required,
  ...rest
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const error = useFieldError(name);
  const id = React.useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
    </Field>
  );
}

/* --------------------------- features list editor ------------------------- */

function FeatureEditor({ initial }: { initial: string[] }) {
  const [features, setFeatures] = React.useState<string[]>(initial.length ? initial : [""]);
  const error = useFieldError("features");

  const update = (i: number, value: string) =>
    setFeatures((list) => list.map((item, index) => (index === i ? value : item)));

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium tracking-tight text-ink-muted">
        What&apos;s included
      </span>
      <input type="hidden" name="features" value={features.filter(Boolean).join("\n")} />
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-right text-xs text-ink-faint tabular-nums">
              {i + 1}
            </span>
            <Input
              value={feature}
              onChange={(e) => update(i, e.target.value)}
              placeholder="Unlimited small-group classes"
              aria-label={`Feature ${i + 1}`}
            />
            <button
              type="button"
              onClick={() => setFeatures((list) => list.filter((_, index) => index !== i))}
              aria-label={`Remove feature ${i + 1}`}
              className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => setFeatures((list) => [...list, ""])}
      >
        <Plus className="size-4" aria-hidden />
        Add a line
      </Button>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        <p className="text-xs text-ink-faint">
          One benefit per line, in the order they should read on the pricing card.
        </p>
      )}
    </div>
  );
}

/* -------------------------------- plan form ------------------------------- */

function PlanForm({ plan, onDone }: { plan?: PlanRecord; onDone: () => void }) {
  return (
    <ActionForm action={savePlan} className="space-y-4" onSuccess={onDone}>
      {plan && <input type="hidden" name="id" value={plan.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Plan name" defaultValue={plan?.name} placeholder="Forge" />
        <TextField
          name="slug"
          label="URL slug"
          defaultValue={plan?.slug}
          placeholder="forge"
          hint="Lowercase, hyphenated. Used in the checkout URL."
        />
      </div>

      <TextField
        name="tagline"
        label="Tagline"
        defaultValue={plan?.tagline}
        placeholder="The one most members stay on."
        hint="One line. Sounds like a coach, not a billboard."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          name="priceInRupees"
          label="Price (₹)"
          type="number"
          step="1"
          min="1"
          defaultValue={plan ? plan.priceInPaise / 100 : undefined}
          placeholder="3990"
          hint="In rupees — stored as paise."
        />
        <IntervalField defaultValue={plan?.interval} />
        <TextField
          name="sortOrder"
          label="Sort order"
          type="number"
          min="0"
          defaultValue={plan?.sortOrder ?? 0}
          hint="Lower shows first."
        />
      </div>

      <FeatureEditor initial={plan?.features ?? []} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Switch
          name="active"
          label="Live on the pricing page"
          defaultChecked={plan ? plan.active : true}
          hint="Off hides it from new members."
        />
        <Switch
          name="highlight"
          label="Feature this plan"
          defaultChecked={plan?.highlight ?? false}
          hint="Gets the emphasised card."
        />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <SubmitButton>{plan ? "Save changes" : "Create plan"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

function IntervalField({ defaultValue }: { defaultValue?: string }) {
  const error = useFieldError("interval");
  const id = React.useId();
  return (
    <Field label="Billed every" error={error} htmlFor={id}>
      <Select id={id} name="interval" defaultValue={defaultValue ?? "MONTHLY"}>
        <option value="MONTHLY">Month</option>
        <option value="QUARTERLY">Quarter</option>
        <option value="YEARLY">Year</option>
      </Select>
    </Field>
  );
}

/* -------------------------------- triggers -------------------------------- */

export function NewPlanButton() {
  const params = useSearchParams();
  return (
    <DialogButton
      label="New plan"
      icon={<Plus className="size-4" aria-hidden />}
      title="Add a membership plan"
      description="It appears on the public pricing page the moment you save it as live."
      defaultOpen={params.get("new") === "1"}
    >
      {(close) => <PlanForm onDone={close} />}
    </DialogButton>
  );
}

export function EditPlanButton({ plan }: { plan: PlanRecord }) {
  return (
    <DialogButton
      label="Edit"
      variant="outline"
      size="sm"
      icon={<Pencil className="size-3.5" aria-hidden />}
      title={`Edit ${plan.name}`}
      description={
        plan.subscriptionCount > 0
          ? `${plan.subscriptionCount} member${plan.subscriptionCount === 1 ? " is" : "s are"} on this plan. Changing the price does not re-bill anyone already subscribed.`
          : "Nobody is on this plan yet, so change whatever you like."
      }
    >
      {(close) => <PlanForm plan={plan} onDone={close} />}
    </DialogButton>
  );
}

export function PlanRowActions({
  plan,
  isFirst,
  isLast,
}: {
  plan: PlanRecord;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ActionButton
        action={movePlan}
        fields={{ id: plan.id, direction: "up" }}
        aria-label={`Move ${plan.name} up`}
        title="Move up"
        className={isFirst ? "pointer-events-none opacity-30" : ""}
      >
        <ArrowUp className="size-4" aria-hidden />
      </ActionButton>
      <ActionButton
        action={movePlan}
        fields={{ id: plan.id, direction: "down" }}
        aria-label={`Move ${plan.name} down`}
        title="Move down"
        className={isLast ? "pointer-events-none opacity-30" : ""}
      >
        <ArrowDown className="size-4" aria-hidden />
      </ActionButton>
      <ActionButton
        action={togglePlanActive}
        fields={{ id: plan.id }}
        aria-label={plan.active ? `Hide ${plan.name}` : `Show ${plan.name}`}
        title={plan.active ? "Hide from pricing" : "Show on pricing"}
      >
        {plan.active ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
      </ActionButton>
      <EditPlanButton plan={plan} />
      <ConfirmAction
        action={deletePlan}
        fields={{ id: plan.id }}
        title={`Delete ${plan.name}?`}
        confirmLabel="Delete plan"
        body={
          plan.subscriptionCount > 0 ? (
            <p>
              <strong className="text-ink">{plan.subscriptionCount}</strong> subscription
              {plan.subscriptionCount === 1 ? "" : "s"} point at this plan, so it can&apos;t be
              deleted — the billing history would go with it. Confirming will deactivate it instead:
              hidden from the pricing page, untouched for everyone already on it.
            </p>
          ) : (
            <p>
              Nothing references this plan, so it will be removed outright. This cannot be undone.
            </p>
          )
        }
        trigger={
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${plan.name}`}
            className="text-ink-faint hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        }
      />
    </div>
  );
}
