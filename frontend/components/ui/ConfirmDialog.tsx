"use client";

import Modal from "@/components/ui/Modal";

import ActionButton from "@/components/ui/ActionButton";

type ConfirmDialogProps = {
  isOpen: boolean;

  title: string;

  description?: string;

  confirmLabel?: string;

  cancelLabel?: string;

  onConfirm: () => void;

  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <ActionButton
            variant="secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </ActionButton>

          <ActionButton
            variant="danger"
            onClick={onConfirm}
          >
            {confirmLabel}
          </ActionButton>
        </div>
      }
    >
      {description && (
        <p className="text-sm leading-6 text-slate-300">
          {description}
        </p>
      )}
    </Modal>
  );
}