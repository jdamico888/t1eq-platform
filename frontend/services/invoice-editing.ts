import type {
  Invoice,
  InvoiceAmendment,
  InvoiceLineItem,
  InvoiceStatus,
} from "@/types/invoice";

import { createId, createTimestamp } from "@/lib/storage";

/**
 * When an invoice may be edited, and when a change has to leave a record.
 *
 * The stages follow the document, not the calendar:
 *
 *  - **Draft** — nothing has gone to the customer, so an edit is just
 *    finishing the work. Free to change, no amendment recorded.
 *  - **Saved or sent to the customer** (Issued, Open, Partial, Overdue) —
 *    someone outside the shop is now holding this document. Managers and
 *    owners can still change it, and every change is recorded.
 *  - **Paid** — the money has moved. Still correctable by a manager or
 *    owner, and every change is recorded.
 *  - **Void or Cancelled** — the invoice is closed as a historical record.
 *    Nothing is edited; a correction is a new invoice.
 *
 * Recording begins the moment the invoice leaves Draft rather than at Paid.
 * A charge document already in the customer's hands that can be altered
 * with no trace is the thing a record of account exists to prevent.
 */

export type InvoiceEditStage =
  /** Editable with no amendment recorded. */
  | "freeEdit"
  /** Editable, and every change is kept as an amendment. */
  | "recordedEdit"
  /** Not editable at all. */
  | "locked";

export function getInvoiceEditStage(status: InvoiceStatus): InvoiceEditStage {
  if (status === "Draft") {
    return "freeEdit";
  }

  if (status === "Void" || status === "Cancelled") {
    return "locked";
  }

  return "recordedEdit";
}

export type InvoiceEditAccess = {
  canEdit: boolean;
  stage: InvoiceEditStage;

  /** Whether a change at this stage must be written to the record. */
  requiresRecord: boolean;

  /** Why editing is closed, when it is. Empty when editing is open. */
  blockedReason: string;

  /** The line shown above the editor explaining the current stage. */
  stageNote: string;
};

export type ResolveInvoiceEditAccessInput = {
  status: InvoiceStatus;

  /**
   * Whether the person holds `editCharges`. Passed in rather than read
   * here so the caller resolves it in an effect — reading permissions
   * during render answers differently on the server than on the client
   * and would trip a hydration mismatch.
   */
  canEditCharges: boolean;
};

export function resolveInvoiceEditAccess({
  status,
  canEditCharges,
}: ResolveInvoiceEditAccessInput): InvoiceEditAccess {
  const stage = getInvoiceEditStage(status);

  if (stage === "locked") {
    return {
      canEdit: false,
      stage,
      requiresRecord: false,
      blockedReason: `This invoice is ${status.toLowerCase()} and stays on record as it is. Correct it by issuing a new invoice.`,
      stageNote: "",
    };
  }

  if (!canEditCharges) {
    return {
      canEdit: false,
      stage,
      requiresRecord: stage === "recordedEdit",
      blockedReason:
        "Editing charges is limited to managers and owners.",
      stageNote: "",
    };
  }

  if (stage === "freeEdit") {
    return {
      canEdit: true,
      stage,
      requiresRecord: false,
      blockedReason: "",
      stageNote:
        "This invoice is still a draft. Changes are not recorded as amendments until it is issued to the customer.",
    };
  }

  return {
    canEdit: true,
    stage,
    requiresRecord: true,
    blockedReason: "",
    stageNote:
      status === "Paid"
        ? "This invoice is paid. It can still be corrected, and every change is kept on the record below."
        : "This invoice has gone to the customer. It can still be corrected, and every change is kept on the record below.",
  };
}

/* ---------------------------------------------------------------- */

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

/** Money compares at cents; float noise is not a change. */
function toCents(value: number): number {
  return Math.round(value * 100);
}

export type AmendmentActor = {
  technicianId?: string;
  name: string;
};

type FieldComparison = {
  field: string;
  previous: string;
  next: string;
};

function compareLineItem(
  previous: InvoiceLineItem,
  next: InvoiceLineItem
): FieldComparison[] {
  const changes: FieldComparison[] = [];

  if (previous.description !== next.description) {
    changes.push({
      field: "Description",
      previous: previous.description,
      next: next.description,
    });
  }

  if (toCents(previous.quantity) !== toCents(next.quantity)) {
    changes.push({
      field: "Quantity",
      previous: String(previous.quantity),
      next: String(next.quantity),
    });
  }

  if (toCents(previous.unitPrice) !== toCents(next.unitPrice)) {
    changes.push({
      field: "Unit Price",
      previous: formatCurrency(previous.unitPrice),
      next: formatCurrency(next.unitPrice),
    });
  }

  return changes;
}

/**
 * Diffs the line items and turns every real difference into an amendment.
 * Added and removed lines are recorded too, so a total can never move
 * without something on the record explaining it.
 */
export function buildLineItemAmendments(
  previousLineItems: InvoiceLineItem[],
  nextLineItems: InvoiceLineItem[],
  statusAtChange: InvoiceStatus,
  actor: AmendmentActor,
  reason?: string
): InvoiceAmendment[] {
  const changedDate = createTimestamp();

  const base = {
    changedDate,
    changedByTechnicianId: actor.technicianId,
    changedByName: actor.name,
    statusAtChange,
    reason: reason?.trim() ? reason.trim() : undefined,
  };

  const previousById = new Map(
    previousLineItems.map((lineItem) => [lineItem.id, lineItem])
  );

  const nextById = new Map(
    nextLineItems.map((lineItem) => [lineItem.id, lineItem])
  );

  const amendments: InvoiceAmendment[] = [];

  for (const nextLineItem of nextLineItems) {
    const previousLineItem = previousById.get(nextLineItem.id);

    if (!previousLineItem) {
      amendments.push({
        ...base,
        id: createId(),
        field: "Line Added",
        lineItemId: nextLineItem.id,
        lineDescription: nextLineItem.description,
        previousValue: "—",
        newValue: `${nextLineItem.quantity} × ${formatCurrency(
          nextLineItem.unitPrice
        )} = ${formatCurrency(nextLineItem.total)}`,
      });

      continue;
    }

    for (const change of compareLineItem(previousLineItem, nextLineItem)) {
      amendments.push({
        ...base,
        id: createId(),
        field: change.field,
        lineItemId: nextLineItem.id,
        lineDescription: previousLineItem.description,
        previousValue: change.previous,
        newValue: change.next,
      });
    }
  }

  for (const previousLineItem of previousLineItems) {
    if (nextById.has(previousLineItem.id)) {
      continue;
    }

    amendments.push({
      ...base,
      id: createId(),
      field: "Line Removed",
      lineItemId: previousLineItem.id,
      lineDescription: previousLineItem.description,
      previousValue: `${previousLineItem.quantity} × ${formatCurrency(
        previousLineItem.unitPrice
      )} = ${formatCurrency(previousLineItem.total)}`,
      newValue: "—",
    });
  }

  return amendments;
}

/**
 * Recomputes a line's total from its own quantity and price, so a hand
 * edit can never leave the line disagreeing with itself.
 */
export function recalculateLineItem(
  lineItem: InvoiceLineItem
): InvoiceLineItem {
  const quantity = Number.isFinite(lineItem.quantity) ? lineItem.quantity : 0;

  const unitPrice = Number.isFinite(lineItem.unitPrice)
    ? lineItem.unitPrice
    : 0;

  return {
    ...lineItem,
    quantity,
    unitPrice,
    rate: unitPrice,
    total: Math.round(quantity * unitPrice * 100) / 100,
  };
}

/**
 * The amendments already on an invoice plus any new ones, oldest first.
 */
export function appendAmendments(
  invoice: Invoice,
  amendments: InvoiceAmendment[]
): InvoiceAmendment[] {
  return [...(invoice.amendments ?? []), ...amendments];
}
