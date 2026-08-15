"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { deleteClass, saveClass, setBookingStatus } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui";
import {
  ActionButton,
  ActionForm,
  SubmitButton,
  useFieldError,
} from "@/components/admin/action-form";
import { ConfirmAction, DialogButton } from "@/components/admin/dialog";

export type TrainerOption = { id: string; name: string; specialty: string };

export type ClassRecord = {
  id: string;
  title: string;
  description: string;
  trainerId: string;
  startsAtLocal: string;
  durationMin: number;
  capacity: number;
  intensity: string;
  imageUrl: string | null;
  bookedCount: number;
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

function ClassForm({
  session,
  trainers,
  defaultStart,
  onDone,
}: {
  session?: ClassRecord;
  trainers: TrainerOption[];
  defaultStart: string;
  onDone: () => void;
}) {
  const descriptionError = useFieldError("description");
  const trainerError = useFieldError("trainerId");
  const intensityError = useFieldError("intensity");
  const descId = React.useId();
  const trainerId = React.useId();
  const intensityId = React.useId();

  return (
    <ActionForm action={saveClass} className="space-y-4" onSuccess={onDone}>
      {session && <input type="hidden" name="id" value={session.id} />}

      <TextField
        name="title"
        label="Session title"
        defaultValue={session?.title}
        placeholder="Barbell Foundations"
      />

      <Field
        label="Description"
        error={descriptionError}
        hint="What actually happens in the hour. One or two sentences."
        htmlFor={descId}
      >
        <Textarea
          id={descId}
          name="description"
          rows={3}
          defaultValue={session?.description}
          placeholder="Squat, press, hinge. Loaded slowly, coached closely, capped at twelve."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Coach" error={trainerError} htmlFor={trainerId}>
          <Select id={trainerId} name="trainerId" defaultValue={session?.trainerId ?? ""}>
            <option value="" disabled>
              Pick a coach…
            </option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name} — {trainer.specialty}
              </option>
            ))}
          </Select>
        </Field>

        <TextField
          name="startsAt"
          label="Starts"
          type="datetime-local"
          defaultValue={session?.startsAtLocal ?? defaultStart}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          name="durationMin"
          label="Length (min)"
          type="number"
          min="10"
          max="240"
          defaultValue={session?.durationMin ?? 60}
        />
        <TextField
          name="capacity"
          label="Capacity"
          type="number"
          min="1"
          max="200"
          defaultValue={session?.capacity ?? 16}
          hint={session ? `${session.bookedCount} booked in` : "Small groups fill faster."}
        />
        <Field label="Intensity" error={intensityError} htmlFor={intensityId}>
          <Select id={intensityId} name="intensity" defaultValue={session?.intensity ?? "MODERATE"}>
            <option value="LOW">Low — restorative</option>
            <option value="MODERATE">Moderate — most people</option>
            <option value="HIGH">High — conditioning</option>
            <option value="ELITE">Elite — technical or brutal</option>
          </Select>
        </Field>
      </div>

      <TextField
        name="imageUrl"
        label="Image URL"
        defaultValue={session?.imageUrl ?? ""}
        placeholder="https://images.unsplash.com/photo-…"
        hint="Optional. Used on the timetable card."
      />

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <SubmitButton>{session ? "Save session" : "Add to timetable"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function NewClassButton({
  trainers,
  defaultStart,
}: {
  trainers: TrainerOption[];
  defaultStart: string;
}) {
  const params = useSearchParams();
  if (trainers.length === 0) {
    return (
      <Button disabled title="Add a coach first — every session needs one">
        <Plus className="size-4" aria-hidden />
        New class
      </Button>
    );
  }
  return (
    <DialogButton
      label="New class"
      icon={<Plus className="size-4" aria-hidden />}
      title="Put a session on the timetable"
      description="Members can book it the moment it saves, so double-check the time."
      defaultOpen={params.get("new") === "1"}
    >
      {(close) => <ClassForm trainers={trainers} defaultStart={defaultStart} onDone={close} />}
    </DialogButton>
  );
}

export function ClassRowActions({
  session,
  trainers,
  defaultStart,
}: {
  session: ClassRecord;
  trainers: TrainerOption[];
  defaultStart: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <DialogButton
        label="Edit"
        variant="outline"
        size="sm"
        icon={<Pencil className="size-3.5" aria-hidden />}
        title={`Edit ${session.title}`}
        description={
          session.bookedCount > 0
            ? `${session.bookedCount} member${session.bookedCount === 1 ? " is" : "s are"} booked in. Moving the time does not notify them.`
            : "Nobody is booked in yet."
        }
      >
        {(close) => (
          <ClassForm
            session={session}
            trainers={trainers}
            defaultStart={defaultStart}
            onDone={close}
          />
        )}
      </DialogButton>

      <ConfirmAction
        action={deleteClass}
        fields={{ id: session.id }}
        title={`Cancel ${session.title}?`}
        confirmLabel="Remove session"
        body={
          session.bookedCount > 0 ? (
            <p>
              <strong className="text-ink">{session.bookedCount}</strong> member
              {session.bookedCount === 1 ? " has" : "s have"} booked this session. Removing it
              releases their bookings without sending them anything — message them first.
            </p>
          ) : (
            <p>Nobody has booked this session, so it comes off the timetable cleanly.</p>
          )
        }
        trigger={
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Remove ${session.title}`}
            className="text-ink-faint hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        }
      />
    </div>
  );
}

export function BookingStatusActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {status !== "ATTENDED" && (
        <ActionButton
          action={setBookingStatus}
          fields={{ id: bookingId, status: "ATTENDED" }}
          variant="ghost"
          size="sm"
        >
          Mark attended
        </ActionButton>
      )}
      {status !== "CANCELLED" && (
        <ActionButton
          action={setBookingStatus}
          fields={{ id: bookingId, status: "CANCELLED" }}
          variant="ghost"
          size="sm"
          className="text-ink-faint hover:text-danger"
        >
          Release spot
        </ActionButton>
      )}
      {status === "CANCELLED" && (
        <ActionButton
          action={setBookingStatus}
          fields={{ id: bookingId, status: "BOOKED" }}
          variant="ghost"
          size="sm"
        >
          Re-book
        </ActionButton>
      )}
    </div>
  );
}
