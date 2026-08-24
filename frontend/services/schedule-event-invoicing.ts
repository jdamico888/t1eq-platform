import type { ScheduleEvent } from "@/types/schedule-event";
import type { RepairOrder, RepairOrderActionItem } from "@/types/repair-order";
import type { Invoice } from "@/types/invoice";

import { generateInvoiceFromRepairOrder } from "@/services/invoice-generator";

/**
 * Appointments (ScheduleEvents) can be invoiced directly, without ever
 * becoming a full Repair Order. Before that's allowed, an appointment has
 * to pass an invoicing gate:
 *
 *  1. At least one part must be present on one of the appointment's action
 *     items (fairness/inventory reasons — you can't bill for parts that
 *     were never logged).
 *
 *  2. Labor needs the completion of a "story" — a written account of what
 *     the labor charge was for (the action item's Completion Notes field).
 *     This does NOT require an actual clocked labor entry from a
 *     technician; anyone can write the story. The point is that the
 *     customer ends up with a record of account explaining the labor
 *     charge, so it's fair and defensible.
 */

function safeNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function actionItemHasPart(actionItem: RepairOrderActionItem): boolean {
  return (
    (actionItem.partEntries?.length ?? 0) > 0 ||
    safeNumber(actionItem.generatedPartsTotal) > 0 ||
    safeNumber(actionItem.partsTotal) > 0
  );
}

function actionItemHasLaborStory(actionItem: RepairOrderActionItem): boolean {
  return Boolean(actionItem.completionNotes && actionItem.completionNotes.trim());
}

export type ScheduleEventInvoiceGateResult = {
  canInvoice: boolean;
  hasPart: boolean;
  hasLaborStory: boolean;
  reasons: string[];
};

export function evaluateScheduleEventInvoiceGate(
  scheduleEvent: ScheduleEvent
): ScheduleEventInvoiceGateResult {
  const actionItems = scheduleEvent.actionItems ?? [];

  const hasPart = actionItems.some(actionItemHasPart);
  const hasLaborStory = actionItems.some(actionItemHasLaborStory);

  const reasons: string[] = [];

  if (!hasPart) {
    reasons.push("Add at least one part to an action item on this appointment.");
  }

  if (!hasLaborStory) {
    reasons.push(
      "Complete the labor story (Completion Notes) on at least one action item so the customer has a record of what the labor charge was for."
    );
  }

  return {
    canInvoice: hasPart && hasLaborStory,
    hasPart,
    hasLaborStory,
    reasons,
  };
}

function buildRepairOrderLikeFromScheduleEvent(
  scheduleEvent: ScheduleEvent
): RepairOrder {
  const timestamp = scheduleEvent.createdDate;

  return {
    id: scheduleEvent.id,
    repairOrderNumber:
      scheduleEvent.repairOrderNumber ?? `APT-${scheduleEvent.id}`,

    status: "Completed",
    priority: "Normal",

    customerId: scheduleEvent.customerId,
    customerName: scheduleEvent.customerName ?? "Unknown Customer",
    customerSnapshot: {
      customerId: scheduleEvent.customerId,
      customerName: scheduleEvent.customerName ?? "Unknown Customer",
      serviceAddress: scheduleEvent.siteName ?? scheduleEvent.location,
    },

    siteId: scheduleEvent.siteId,
    siteName: scheduleEvent.siteName,

    equipmentId: scheduleEvent.equipmentId,
    equipmentName: scheduleEvent.equipmentName,

    complaint: scheduleEvent.description ?? scheduleEvent.title,

    notes: scheduleEvent.notes,

    openedDate: timestamp,

    modelSerialPhotoRequired: false,
    modelSerialPhotoCaptured: false,

    photos: [],
    actionItems: scheduleEvent.actionItems ?? [],
    laborEntries: [],

    subtotalLabor: 0,
    subtotalParts: 0,
    subtotalOther: 0,
    totalAmount: 0,

    createdDate: timestamp,
  };
}

export function generateInvoiceFromScheduleEvent(
  scheduleEvent: ScheduleEvent,
  taxRate = 0
): Invoice {
  const repairOrderLike = buildRepairOrderLikeFromScheduleEvent(scheduleEvent);
  const generatedInvoice = generateInvoiceFromRepairOrder(
    repairOrderLike,
    taxRate
  );

  return {
    ...generatedInvoice,

    // The appointment stands on its own unless it's actually linked to a
    // real Repair Order — don't let the appointment's internal id leak
    // into the invoice as a fake RO number.
    repairOrderId: scheduleEvent.repairOrderId,
    repairOrderNumber: scheduleEvent.repairOrderNumber,
    repairOrderRO: undefined,

    scheduleEventId: scheduleEvent.id,
    scheduleEventTitle: scheduleEvent.title,
  };
}
