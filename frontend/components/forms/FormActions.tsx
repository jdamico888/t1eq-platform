"use client";

import ActionButton from "@/components/ui/ActionButton";

type FormActionsProps = {
  isEditing?: boolean;
  submitLabel?: string;
  updateLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
};

export default function FormActions({
  isEditing = false,
  submitLabel = "Create",
  updateLabel = "Update",
  cancelLabel = "Cancel",
  onCancel,
  isSubmitting = false,
}: FormActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-4">
      <ActionButton type="submit" disabled={isSubmitting}>
        {isEditing ? updateLabel : submitLabel}
      </ActionButton>

      {isEditing && onCancel && (
        <ActionButton type="button" variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </ActionButton>
      )}
    </div>
  );
}