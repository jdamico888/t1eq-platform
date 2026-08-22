"use client";

import ActionButton from "@/components/ui/ActionButton";

type FormActionsProps = {
  isEditing?: boolean;

  submitLabel?: string;
  updateLabel?: string;
  cancelLabel?: string;

  onCancel?: () => void;

  isSubmitting?: boolean;

  extraActions?: React.ReactNode;

  qbitId?: string;
  qbitScope?: string;
};

export default function FormActions({
  isEditing = false,
  submitLabel = "Create",
  updateLabel = "Update",
  cancelLabel = "Cancel",
  onCancel,
  isSubmitting = false,
  extraActions,
  qbitId,
  qbitScope = "global",
}: FormActionsProps) {
  const submitQbitId = qbitId
    ? `${qbitId}-${isEditing ? "update" : "submit"}`
    : undefined;

  const cancelQbitId = qbitId
    ? `${qbitId}-cancel`
    : undefined;

  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId ? `${qbitId}-actions` : undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className="flex flex-wrap items-center gap-3 pt-4"
    >
      <ActionButton
        type="submit"
        disabled={isSubmitting}
        qbitId={submitQbitId}
        qbitScope={qbitScope}
      >
        {isEditing ? updateLabel : submitLabel}
      </ActionButton>

      {isEditing && onCancel && (
        <ActionButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          qbitId={cancelQbitId}
          qbitScope={qbitScope}
        >
          {cancelLabel}
        </ActionButton>
      )}

      {extraActions && (
        <div
          data-t1eq-qbit-type={qbitId ? "section" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-extra-actions` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className="flex flex-wrap items-center gap-3"
        >
          {extraActions}
        </div>
      )}
    </div>
  );
}