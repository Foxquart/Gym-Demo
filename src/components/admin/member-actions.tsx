"use client";

import * as React from "react";
import { CalendarPlus, ShieldCheck, ShieldOff, Trash2, Undo2, XCircle } from "lucide-react";

import {
  cancelSubscription,
  deleteMember,
  extendSubscription,
  reactivateSubscription,
  setMemberRole,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui";
import { ActionButton, ActionForm, SubmitButton, useFieldError } from "@/components/admin/action-form";
import { ConfirmAction, DialogButton } from "@/components/admin/dialog";

export function RoleAction({
  userId,
  name,
  role,
  isSelf,
}: {
  userId: string;
  name: string;
  role: "USER" | "ADMIN";
  isSelf: boolean;
}) {
  if (isSelf) {
    return (
      <Button variant="outline" size="sm" disabled title="Ask another admin to change your own role">
        <ShieldCheck className="size-4" aria-hidden />
        That&apos;s you
      </Button>
    );
  }

  if (role === "ADMIN") {
    return (
      <ConfirmAction
        action={setMemberRole}
        fields={{ userId, role: "USER" }}
        title={`Take ${name}'s admin access away?`}
        body={
          <p>
            They keep their membership, bookings and billing history — they just lose the operations
            portal. You can promote them again at any time.
          </p>
        }
        confirmLabel="Demote to member"
        trigger={
          <Button variant="outline" size="sm">
            <ShieldOff className="size-4" aria-hidden />
            Demote
          </Button>
        }
      />
    );
  }

  return (
    <ConfirmAction
      action={setMemberRole}
      fields={{ userId, role: "ADMIN" }}
      title={`Give ${name} admin access?`}
      body={
        <p>
          Admins can see every member&apos;s details, change prices, edit the timetable and delete
          accounts. Only hand this out to people who run the club.
        </p>
      }
      confirmLabel="Promote to admin"
      trigger={
        <Button variant="outline" size="sm">
          <ShieldCheck className="size-4" aria-hidden />
          Promote
        </Button>
      }
    />
  );
}

export function ExtendAction({
  subscriptionId,
  planName,
}: {
  subscriptionId: string;
  planName: string;
}) {
  return (
    <DialogButton
      label="Extend"
      variant="outline"
      size="sm"
      icon={<CalendarPlus className="size-4" aria-hidden />}
      title="Extend this membership"
      description={`Pushes the end date on ${planName} forward. Use it for goodwill credit, a paused month, or a payment taken off-system.`}
      dialogSize="sm"
    >
      {(close) => <ExtendForm subscriptionId={subscriptionId} onDone={close} />}
    </DialogButton>
  );
}

function ExtendForm({ subscriptionId, onDone }: { subscriptionId: string; onDone: () => void }) {
  return (
    <ActionForm action={extendSubscription} className="space-y-4" onSuccess={onDone}>
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <MonthsField />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <SubmitButton>Extend membership</SubmitButton>
      </div>
    </ActionForm>
  );
}

function MonthsField() {
  const error = useFieldError("months");
  return (
    <Field label="Add how long?" error={error} hint="Counted from the current end date." htmlFor="months">
      <Select id="months" name="months" defaultValue="1">
        <option value="1">1 month</option>
        <option value="2">2 months</option>
        <option value="3">3 months — a quarter</option>
        <option value="6">6 months</option>
        <option value="12">12 months — a year</option>
      </Select>
    </Field>
  );
}

export function SubscriptionStateAction({
  subscriptionId,
  status,
  planName,
}: {
  subscriptionId: string;
  status: string;
  planName: string;
}) {
  if (status === "ACTIVE" || status === "PENDING") {
    return (
      <ConfirmAction
        action={cancelSubscription}
        fields={{ subscriptionId }}
        title={`Cancel ${planName}?`}
        body={
          <>
            <p>
              The member keeps floor access until the current end date, then stops being billed. No
              refund is issued from here — do that in Razorpay.
            </p>
            <p>Their bookings and history stay exactly where they are.</p>
          </>
        }
        confirmLabel="Cancel membership"
        trigger={
          <Button variant="outline" size="sm">
            <XCircle className="size-4" aria-hidden />
            Cancel
          </Button>
        }
      />
    );
  }

  return (
    <ActionButton
      action={reactivateSubscription}
      fields={{ subscriptionId }}
      variant="outline"
      size="sm"
    >
      <Undo2 className="size-4" aria-hidden />
      Reactivate
    </ActionButton>
  );
}

export function DeleteMemberAction({
  userId,
  name,
  counts,
}: {
  userId: string;
  name: string;
  counts: { payments: number; bookings: number; checkIns: number };
}) {
  return (
    <ConfirmAction
      action={deleteMember}
      fields={{ userId }}
      requireTyping="DELETE"
      title={`Delete ${name}?`}
      confirmLabel="Delete this member"
      body={
        <>
          <p>
            This removes the account and everything attached to it:{" "}
            <strong className="text-ink">{counts.payments}</strong> payment
            {counts.payments === 1 ? "" : "s"},{" "}
            <strong className="text-ink">{counts.bookings}</strong> booking
            {counts.bookings === 1 ? "" : "s"} and{" "}
            <strong className="text-ink">{counts.checkIns}</strong> check-in
            {counts.checkIns === 1 ? "" : "s"}. It cannot be undone.
          </p>
          <p>
            If you only want to stop billing them, cancel the membership instead — that keeps the
            record.
          </p>
        </>
      }
      trigger={
        <Button variant="danger" size="sm">
          <Trash2 className="size-4" aria-hidden />
          Delete member
        </Button>
      }
    />
  );
}
