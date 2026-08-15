"use client";

import { Check, Trash2, Undo2 } from "lucide-react";

import { deleteLead, setLeadHandled } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/admin/action-form";
import { ConfirmAction } from "@/components/admin/dialog";

export function LeadActions({
  id,
  name,
  handled,
}: {
  id: string;
  name: string;
  handled: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ActionButton
        action={setLeadHandled}
        fields={{ id, handled: handled ? "false" : "true" }}
        variant="outline"
        size="sm"
      >
        {handled ? (
          <>
            <Undo2 className="size-3.5" aria-hidden />
            Reopen
          </>
        ) : (
          <>
            <Check className="size-3.5" aria-hidden />
            Mark handled
          </>
        )}
      </ActionButton>

      <ConfirmAction
        action={deleteLead}
        fields={{ id }}
        title={`Delete the enquiry from ${name}?`}
        confirmLabel="Delete enquiry"
        body={
          <p>
            The message and their contact details go with it. If you might want to follow up later,
            mark it handled instead — handled enquiries stay searchable.
          </p>
        }
        trigger={
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete enquiry from ${name}`}
            className="text-ink-faint hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        }
      />
    </div>
  );
}
