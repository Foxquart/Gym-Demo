"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ImageOff, Pencil, Plus, Power, Trash2 } from "lucide-react";

import { deleteTrainer, saveTrainer, toggleTrainerActive } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui";
import {
  ActionButton,
  ActionForm,
  SubmitButton,
  Switch,
  useFieldError,
} from "@/components/admin/action-form";
import { ConfirmAction, DialogButton } from "@/components/admin/dialog";
import { cn } from "@/lib/utils";

export type TrainerRecord = {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  bio: string;
  imageUrl: string;
  experienceYears: number;
  rating: number;
  active: boolean;
  classCount: number;
};

function TextField({
  name,
  label,
  hint,
  defaultValue,
  placeholder,
  ...rest
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | number;
  placeholder?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const error = useFieldError(name);
  const id = React.useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <Input
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
    </Field>
  );
}

/** Live preview so nobody saves a broken portrait onto the public site. */
function ImageField({ defaultValue }: { defaultValue?: string }) {
  const [url, setUrl] = React.useState(defaultValue ?? "");
  const [broken, setBroken] = React.useState(false);
  const error = useFieldError("imageUrl");
  const id = React.useId();

  return (
    <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
      <div className="order-2 sm:order-1">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-muted">Preview</span>
        <div
          className={cn(
            "grid aspect-[3/4] w-28 place-items-center overflow-hidden rounded-xl border border-border bg-bg-subtle",
            broken && "border-danger/50",
          )}
        >
          {url && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              onError={() => setBroken(true)}
              className="size-full object-cover"
            />
          ) : (
            <ImageOff className="size-5 text-ink-faint" aria-hidden />
          )}
        </div>
      </div>
      <div className="order-1 sm:order-2">
        <Field
          label="Portrait URL"
          error={error ?? (broken && url ? "That URL didn't load an image." : undefined)}
          hint="A full https:// link. Portrait crop reads best on the coaches page."
          htmlFor={id}
        >
          <Input
            id={id}
            name="imageUrl"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setBroken(false);
            }}
            placeholder="https://images.unsplash.com/photo-…"
          />
        </Field>
      </div>
    </div>
  );
}

function TrainerForm({ trainer, onDone }: { trainer?: TrainerRecord; onDone: () => void }) {
  const bioError = useFieldError("bio");
  return (
    <ActionForm action={saveTrainer} className="space-y-4" onSuccess={onDone}>
      {trainer && <input type="hidden" name="id" value={trainer.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Name" defaultValue={trainer?.name} placeholder="Vikram Shetty" />
        <TextField
          name="slug"
          label="URL slug"
          defaultValue={trainer?.slug}
          placeholder="vikram-shetty"
          hint="Lowercase, hyphenated."
        />
      </div>

      <TextField
        name="specialty"
        label="Specialty"
        defaultValue={trainer?.specialty}
        placeholder="Strength & Powerlifting"
      />

      <BioField defaultValue={trainer?.bio} error={bioError} />

      <ImageField defaultValue={trainer?.imageUrl} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="experienceYears"
          label="Years coaching"
          type="number"
          min="0"
          max="60"
          defaultValue={trainer?.experienceYears ?? 1}
        />
        <TextField
          name="rating"
          label="Member rating"
          type="number"
          step="0.1"
          min="1"
          max="5"
          defaultValue={trainer?.rating ?? 5}
          hint="Out of five. Shown on the coaches page."
        />
      </div>

      <Switch
        name="active"
        label="On the roster"
        defaultChecked={trainer ? trainer.active : true}
        hint="Off keeps the profile but hides it from the site."
      />

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <SubmitButton>{trainer ? "Save changes" : "Add coach"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

function BioField({ defaultValue, error }: { defaultValue?: string; error?: string }) {
  const id = React.useId();
  return (
    <Field
      label="Bio"
      error={error}
      hint="Two or three sentences. Specific beats flattering — what do they actually fix?"
      htmlFor={id}
    >
      <Textarea
        id={id}
        name="bio"
        defaultValue={defaultValue}
        rows={4}
        placeholder="Physiotherapist first, coach second. If something clicks, pinches or refuses to load…"
      />
    </Field>
  );
}

export function NewTrainerButton() {
  const params = useSearchParams();
  return (
    <DialogButton
      label="New coach"
      icon={<Plus className="size-4" aria-hidden />}
      title="Add a coach"
      description="They appear on the public coaches page and become pickable for classes."
      defaultOpen={params.get("new") === "1"}
    >
      {(close) => <TrainerForm onDone={close} />}
    </DialogButton>
  );
}

export function TrainerRowActions({ trainer }: { trainer: TrainerRecord }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ActionButton
        action={toggleTrainerActive}
        fields={{ id: trainer.id }}
        aria-label={trainer.active ? `Deactivate ${trainer.name}` : `Reactivate ${trainer.name}`}
        title={trainer.active ? "Take off the roster" : "Put back on the roster"}
      >
        <Power className={cn("size-4", trainer.active && "text-success")} aria-hidden />
      </ActionButton>

      <DialogButton
        label="Edit"
        variant="outline"
        size="sm"
        icon={<Pencil className="size-3.5" aria-hidden />}
        title={`Edit ${trainer.name}`}
        description={
          trainer.classCount > 0
            ? `Coaching ${trainer.classCount} session${trainer.classCount === 1 ? "" : "s"} on the timetable.`
            : "Not on the timetable yet."
        }
      >
        {(close) => <TrainerForm trainer={trainer} onDone={close} />}
      </DialogButton>

      <ConfirmAction
        action={deleteTrainer}
        fields={{ id: trainer.id }}
        title={`Delete ${trainer.name}?`}
        confirmLabel="Delete coach"
        body={
          trainer.classCount > 0 ? (
            <p>
              They still coach <strong className="text-ink">{trainer.classCount}</strong> session
              {trainer.classCount === 1 ? "" : "s"}. Deleting the profile would delete those classes
              and every booking on them, so confirming will only deactivate the profile. Reassign the
              sessions first if you truly want them gone.
            </p>
          ) : (
            <p>
              No sessions are assigned to {trainer.name}, so the profile will be removed outright.
              This cannot be undone.
            </p>
          )
        }
        trigger={
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${trainer.name}`}
            className="text-ink-faint hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        }
      />
    </div>
  );
}
