import type { ScheduleEvent } from "@/types/schedule-event";
import type {
  RepairOrderActionItem,
  RepairOrderPartEntry,
} from "@/types/repair-order";
import type { InventoryItem } from "@/types/inventory-item";
import type { Invoice, InvoiceLineItem } from "@/types/invoice";
import type { SpecialOrderStatus } from "@/types/special-order";

import {
  isPaidSpecialOrderStatus,
  specialOrderStatuses,
} from "@/types/special-order";

import { getAppSettings } from "@/services/app-settings";
import { getInventoryItemById } from "@/services/inventory";
import {
  calculateInvoiceTotals,
  createInvoice,
  generateInvoiceNumber,
} from "@/services/invoices";
import {
  getScheduleEventById,
  updateScheduleEvent,
} from "@/services/schedule-events";

/**
 * The special-order path for appointments.
 *
 * A repair order bills after the work. An appointment that needs a part
 * the shop does not stock cannot wait that long: ordering it puts the shop
 * out of pocket, so the customer pays first. That gives an appointment
 * something a repair order never has — parts charges, and a live status on
 * them, before any work is done and without an RO existing.
 *
 * This runs alongside the appointment invoicing gate in
 * schedule-event-invoicing.ts rather than loosening it. That gate exists
 * so a *labor* charge always comes with a written story explaining it. A
 * prepayment invoice bills no labor at all, so the story is not owed yet
 * and the gate has nothing to say about it.
 */

function safeNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function specialOrderPrepaymentRequired(): boolean {
  return getAppSettings().specialOrderRequiresPrepayment !== false;
}

/**
 * Whether a line is a special order. The line's own flag decides when it
 * is set, so a one-off order of a normally-stocked part is possible;
 * otherwise the part's standing flag in inventory applies.
 */
export function isSpecialOrderPartEntry(
  partEntry: RepairOrderPartEntry,
  inventoryItem?: InventoryItem | null
): boolean {
  if (typeof partEntry.isSpecialOrder === "boolean") {
    return partEntry.isSpecialOrder;
  }

  const item =
    inventoryItem ??
    (partEntry.inventoryItemId
      ? getInventoryItemById(partEntry.inventoryItemId)
      : null);

  return Boolean(item?.isSpecialOrder);
}

/** Where a newly added special-order line starts. */
export function resolveInitialSpecialOrderStatus(): SpecialOrderStatus {
  return "Quoted";
}

export function getNextSpecialOrderStatus(
  status: SpecialOrderStatus
): SpecialOrderStatus | null {
  const position = specialOrderStatuses.indexOf(status);

  if (position === -1 || position === specialOrderStatuses.length - 1) {
    return null;
  }

  return specialOrderStatuses[position + 1];
}

/* ---------------------------------------------------------------- */

export type SpecialOrderPartRef = {
  actionItemId: string;
  actionItemTitle: string;
  partEntry: RepairOrderPartEntry;
  status: SpecialOrderStatus;
  lineTotal: number;
};

function getActionItemTitle(actionItem: RepairOrderActionItem): string {
  return (
    actionItem.title ||
    actionItem.description ||
    actionItem.type ||
    "Action item"
  );
}

function getLineTotal(partEntry: RepairOrderPartEntry): number {
  const explicitTotal = safeNumber(partEntry.total, Number.NaN);

  if (Number.isFinite(explicitTotal) && explicitTotal > 0) {
    return explicitTotal;
  }

  return (
    safeNumber(partEntry.quantity, 1) *
    safeNumber(partEntry.sellPrice ?? partEntry.unitPrice ?? partEntry.price)
  );
}

/** Every special-order line on an appointment, across its action items. */
export function getScheduleEventSpecialOrderParts(
  scheduleEvent: ScheduleEvent
): SpecialOrderPartRef[] {
  const refs: SpecialOrderPartRef[] = [];

  for (const actionItem of scheduleEvent.actionItems ?? []) {
    for (const partEntry of actionItem.partEntries ?? []) {
      if (!isSpecialOrderPartEntry(partEntry)) {
        continue;
      }

      refs.push({
        actionItemId: actionItem.id,
        actionItemTitle: getActionItemTitle(actionItem),
        partEntry,
        status: partEntry.specialOrderStatus ?? "Quoted",
        lineTotal: getLineTotal(partEntry),
      });
    }
  }

  return refs;
}

export type SpecialOrderSummary = {
  parts: SpecialOrderPartRef[];
  countByStatus: Record<SpecialOrderStatus, number>;

  /** Lines not yet billed on a prepayment invoice. */
  awaitingBilling: SpecialOrderPartRef[];

  /** What those lines come to. */
  awaitingBillingTotal: number;

  /** What the customer has already paid across all prepayment invoices. */
  prepaidTotal: number;
};

export function summarizeScheduleEventSpecialOrders(
  scheduleEvent: ScheduleEvent
): SpecialOrderSummary {
  const parts = getScheduleEventSpecialOrderParts(scheduleEvent);

  const countByStatus = specialOrderStatuses.reduce(
    (counts, status) => {
      counts[status] = parts.filter((part) => part.status === status).length;

      return counts;
    },
    {} as Record<SpecialOrderStatus, number>
  );

  const awaitingBilling = parts.filter(
    (part) => !part.partEntry.prepaymentInvoiceId
  );

  return {
    parts,
    countByStatus,
    awaitingBilling,
    awaitingBillingTotal: awaitingBilling.reduce(
      (total, part) => total + part.lineTotal,
      0
    ),
    prepaidTotal: parts.reduce(
      (total, part) => total + safeNumber(part.partEntry.prepaidAmount),
      0
    ),
  };
}

/* ---------------------------------------------------------------- */

export type SpecialOrderPrepaymentGate = {
  canBill: boolean;
  reasons: string[];
  summary: SpecialOrderSummary;
};

/**
 * Whether a prepayment invoice can be raised. Deliberately separate from
 * the appointment's labor gate — this bills parts only.
 */
export function evaluateSpecialOrderPrepaymentGate(
  scheduleEvent: ScheduleEvent
): SpecialOrderPrepaymentGate {
  const summary = summarizeScheduleEventSpecialOrders(scheduleEvent);

  const reasons: string[] = [];

  if (!specialOrderPrepaymentRequired()) {
    reasons.push(
      "Prepayment for special-order parts is switched off in Settings → Parts."
    );
  }

  if (summary.parts.length === 0) {
    reasons.push("No special-order parts on this appointment.");
  } else if (summary.awaitingBilling.length === 0) {
    reasons.push("Every special-order part is already on a prepayment invoice.");
  }

  return {
    canBill: reasons.length === 0,
    reasons,
    summary,
  };
}

/* ---------------------------------------------------------------- */

/**
 * Rewrites the appointment's part entries in place. Everything that
 * changes a special-order line goes through here, so the appointment is
 * the one place the status lives.
 */
function updateScheduleEventPartEntries(
  scheduleEvent: ScheduleEvent,
  update: (partEntry: RepairOrderPartEntry) => RepairOrderPartEntry
): ScheduleEvent {
  const nextEvent: ScheduleEvent = {
    ...scheduleEvent,
    actionItems: (scheduleEvent.actionItems ?? []).map((actionItem) => ({
      ...actionItem,
      partEntries: (actionItem.partEntries ?? []).map(update),
    })),
  };

  updateScheduleEvent(nextEvent);

  return nextEvent;
}

export function setSpecialOrderPartStatus(
  scheduleEventId: string,
  partEntryId: string,
  status: SpecialOrderStatus
): ScheduleEvent | null {
  const scheduleEvent = getScheduleEventById(scheduleEventId);

  if (!scheduleEvent) {
    return null;
  }

  return updateScheduleEventPartEntries(scheduleEvent, (partEntry) =>
    partEntry.id === partEntryId
      ? {
          ...partEntry,
          specialOrderStatus: status,
          updatedDate: new Date().toISOString(),
        }
      : partEntry
  );
}

/**
 * Marks a line as a special order (or clears it back to a normal part),
 * seeding the status the first time.
 */
export function setSpecialOrderPartFlag(
  scheduleEventId: string,
  partEntryId: string,
  isSpecialOrder: boolean
): ScheduleEvent | null {
  const scheduleEvent = getScheduleEventById(scheduleEventId);

  if (!scheduleEvent) {
    return null;
  }

  return updateScheduleEventPartEntries(scheduleEvent, (partEntry) =>
    partEntry.id === partEntryId
      ? {
          ...partEntry,
          isSpecialOrder,
          specialOrderStatus: isSpecialOrder
            ? (partEntry.specialOrderStatus ??
              resolveInitialSpecialOrderStatus())
            : undefined,
          updatedDate: new Date().toISOString(),
        }
      : partEntry
  );
}

/* ---------------------------------------------------------------- */

export type PrepaymentInvoiceResult = {
  invoice: Invoice;
  scheduleEvent: ScheduleEvent;
  billedPartEntryIds: string[];
};

/**
 * Raises a parts-only prepayment invoice for the special-order lines that
 * have not been billed yet, and moves each of them to Awaiting Prepayment.
 *
 * The amount prepaid is stamped onto each line so the final invoice can
 * credit it back rather than charging the customer twice.
 */
export function generateSpecialOrderPrepaymentInvoice(
  scheduleEvent: ScheduleEvent,
  taxRate = 0
): PrepaymentInvoiceResult | null {
  const gate = evaluateSpecialOrderPrepaymentGate(scheduleEvent);

  if (!gate.canBill) {
    return null;
  }

  const billedParts = gate.summary.awaitingBilling;

  const lineItems: InvoiceLineItem[] = billedParts.map((part) => ({
    id: `special-order-${part.partEntry.id}`,
    type: "Parts",
    description: `Special order — ${part.partEntry.partNumber}${
      part.partEntry.description ? ` · ${part.partEntry.description}` : ""
    }`,
    quantity: safeNumber(part.partEntry.quantity, 1),
    unitPrice: safeNumber(
      part.partEntry.sellPrice ??
        part.partEntry.unitPrice ??
        part.partEntry.price
    ),
    rate: safeNumber(
      part.partEntry.sellPrice ??
        part.partEntry.unitPrice ??
        part.partEntry.price
    ),
    total: part.lineTotal,

    actionItemId: part.actionItemId,

    sourceId: part.partEntry.id,
    sourceType: "Part Entry",

    inventoryItemId: part.partEntry.inventoryItemId,
    partNumber: part.partEntry.partNumber,

    notes: "Paid in advance so the part can be ordered.",
  }));

  const totals = calculateInvoiceTotals(lineItems, taxRate);

  const invoiceNumber = generateInvoiceNumber();

  const invoice = createInvoice({
    invoiceNumber,

    scheduleEventId: scheduleEvent.id,
    scheduleEventTitle: scheduleEvent.title,

    customerId: scheduleEvent.customerId ?? "",
    customerName: scheduleEvent.customerName ?? "Unknown Customer",

    siteId: scheduleEvent.siteId,
    siteName: scheduleEvent.siteName,

    equipmentId: scheduleEvent.equipmentId,
    equipmentName: scheduleEvent.equipmentName,

    complaint: scheduleEvent.description ?? scheduleEvent.title,

    workPerformed:
      "Special-order parts billed in advance. No labor has been performed on this invoice.",

    lineItems,

    taxRate,
    ...totals,

    amountPaid: 0,
    balanceDue: totals.totalAmount,

    status: "Draft",

    notes:
      "Prepayment for special-order parts. These parts are ordered once this invoice is paid.",
  });

  const billedPartEntryIds = billedParts.map((part) => part.partEntry.id);

  const billedTotalById = new Map(
    billedParts.map((part) => [part.partEntry.id, part.lineTotal])
  );

  const nextEvent = updateScheduleEventPartEntries(
    scheduleEvent,
    (partEntry) => {
      if (!billedTotalById.has(partEntry.id)) {
        return partEntry;
      }

      return {
        ...partEntry,
        isSpecialOrder: true,
        specialOrderStatus: "Awaiting Prepayment",
        prepaymentInvoiceId: invoice.id,
        prepaymentInvoiceNumber: invoice.invoiceNumber,
        prepaidAmount: billedTotalById.get(partEntry.id) ?? 0,
        updatedDate: new Date().toISOString(),
      };
    }
  );

  return {
    invoice,
    scheduleEvent: nextEvent,
    billedPartEntryIds,
  };
}

/**
 * Moves every part billed on a prepayment invoice to Paid, so the shop
 * knows it can order them. Called when that invoice is paid.
 */
export function markPrepaymentInvoicePaid(
  scheduleEventId: string,
  invoiceId: string
): ScheduleEvent | null {
  const scheduleEvent = getScheduleEventById(scheduleEventId);

  if (!scheduleEvent) {
    return null;
  }

  return updateScheduleEventPartEntries(scheduleEvent, (partEntry) =>
    partEntry.prepaymentInvoiceId === invoiceId
      ? {
          ...partEntry,
          specialOrderStatus: "Paid",
          updatedDate: new Date().toISOString(),
        }
      : partEntry
  );
}

/* ---------------------------------------------------------------- */

/**
 * A credit line for everything the customer already paid up front.
 *
 * Without this the final invoice would bill the special-order parts a
 * second time. Crediting rather than omitting is the honest presentation:
 * the customer sees the whole job, and sees what they already paid come
 * off the bottom.
 */
export function buildPrepaymentCreditLine(
  scheduleEvent: ScheduleEvent
): InvoiceLineItem | null {
  const parts = getScheduleEventSpecialOrderParts(scheduleEvent).filter(
    (part) =>
      part.partEntry.prepaymentInvoiceId &&
      isPaidSpecialOrderStatus(part.status) &&
      safeNumber(part.partEntry.prepaidAmount) > 0
  );

  if (parts.length === 0) {
    return null;
  }

  const prepaidTotal = parts.reduce(
    (total, part) => total + safeNumber(part.partEntry.prepaidAmount),
    0
  );

  const invoiceNumbers = Array.from(
    new Set(
      parts
        .map((part) => part.partEntry.prepaymentInvoiceNumber)
        .filter((invoiceNumber): invoiceNumber is string =>
          Boolean(invoiceNumber)
        )
    )
  );

  const reference =
    invoiceNumbers.length > 0 ? ` (${invoiceNumbers.join(", ")})` : "";

  return {
    id: `prepayment-credit-${scheduleEvent.id}`,
    type: "Other",
    description: `Less special-order parts already paid${reference}`,
    quantity: 1,
    unitPrice: -prepaidTotal,
    rate: -prepaidTotal,
    total: -prepaidTotal,
    sourceType: "Manual",
    notes: "Prepaid before the parts were ordered.",
  };
}
