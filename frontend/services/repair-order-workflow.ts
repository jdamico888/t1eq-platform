import type {
  RepairOrder,
  RepairOrderStatus,
  RepairOrderStatusDateField,
} from "@/types/repair-order";
import { repairOrderStatusDateFieldByStatus } from "@/types/repair-order";

export type RepairOrderStatusTransition = {
  from: RepairOrderStatus;
  to: RepairOrderStatus;
  label: string;
};

export const repairOrderStatusOptions: RepairOrderStatus[] = [
  "Draft",
  "Open",
  "Scheduled",
  "Dispatched",
  "In Progress",
  "Waiting Parts",
  "Waiting Approval",
  "Completed",
  "Closed",
  "Invoiced",
  "Cancelled",
];

export const activeRepairOrderStatuses: RepairOrderStatus[] = [
  "Draft",
  "Open",
  "Scheduled",
  "Dispatched",
  "In Progress",
  "Waiting Parts",
  "Waiting Approval",
];

export const finalRepairOrderStatuses: RepairOrderStatus[] = [
  "Completed",
  "Closed",
  "Invoiced",
  "Cancelled",
];

export const repairOrderAllowedNextStatuses: Record<
  RepairOrderStatus,
  RepairOrderStatus[]
> = {
  Draft: ["Open", "Scheduled", "Cancelled"],
  Open: ["Scheduled", "Dispatched", "In Progress", "Waiting Approval", "Cancelled"],
  Scheduled: ["Dispatched", "In Progress", "Waiting Approval", "Cancelled"],
  Dispatched: ["In Progress", "Waiting Parts", "Waiting Approval", "Cancelled"],
  "In Progress": ["Waiting Parts", "Waiting Approval", "Completed", "Cancelled"],
  "Waiting Parts": ["In Progress", "Waiting Approval", "Completed", "Cancelled"],
  "Waiting on Parts": ["In Progress", "Waiting Approval", "Completed", "Cancelled"],
  "Waiting Approval": ["In Progress", "Waiting Parts", "Completed", "Cancelled"],
  Completed: ["Closed", "Invoiced"],
  Closed: ["Invoiced"],
  Invoiced: [],
  Cancelled: [],
};

export const repairOrderStatusDateFields: Record<
  RepairOrderStatus,
  RepairOrderStatusDateField
> = repairOrderStatusDateFieldByStatus;

function createTimestamp() {
  return new Date().toISOString();
}

export function normalizeRepairOrderStatus(
  status: RepairOrderStatus | string
): RepairOrderStatus {
  if (status === "Waiting on Parts") {
    return "Waiting Parts";
  }

  if (repairOrderStatusOptions.includes(status as RepairOrderStatus)) {
    return status as RepairOrderStatus;
  }

  return "Open";
}

export function getRepairOrderStatusDateField(
  status: RepairOrderStatus
): RepairOrderStatusDateField {
  return repairOrderStatusDateFieldByStatus[status];
}

export function getRepairOrderAllowedNextStatuses(
  status: RepairOrderStatus
): RepairOrderStatus[] {
  return repairOrderAllowedNextStatuses[status] ?? [];
}

export function repairOrderStatusCanTransition(
  currentStatus: RepairOrderStatus,
  nextStatus: RepairOrderStatus
): boolean {
  return getRepairOrderAllowedNextStatuses(currentStatus).includes(nextStatus);
}

export function canTransitionRepairOrderStatus(
  currentStatus: RepairOrderStatus,
  nextStatus: RepairOrderStatus
): boolean {
  return repairOrderStatusCanTransition(currentStatus, nextStatus);
}

export function getAvailableRepairOrderStatusTransitions(
  currentStatus: RepairOrderStatus
): RepairOrderStatusTransition[] {
  return getRepairOrderAllowedNextStatuses(currentStatus).map((nextStatus) => ({
    from: currentStatus,
    to: nextStatus,
    label: nextStatus,
  }));
}

export function repairOrderIsActive(status: RepairOrderStatus): boolean {
  return activeRepairOrderStatuses.includes(status);
}

export function repairOrderIsFinal(status: RepairOrderStatus): boolean {
  return finalRepairOrderStatuses.includes(status);
}

export function buildRepairOrderStatusTransitionUpdate(
  repairOrder: RepairOrder,
  nextStatus: RepairOrderStatus,
  timestamp = createTimestamp()
): Partial<RepairOrder> {
  const normalizedNextStatus = normalizeRepairOrderStatus(nextStatus);
  const dateField = getRepairOrderStatusDateField(normalizedNextStatus);

  return {
    status: normalizedNextStatus,
    [dateField]: timestamp,
    updatedDate: timestamp,

    closedDate:
      normalizedNextStatus === "Closed" ? timestamp : repairOrder.closedDate,

    completedDate:
      normalizedNextStatus === "Completed"
        ? timestamp
        : repairOrder.completedDate,

    cancelledDate:
      normalizedNextStatus === "Cancelled"
        ? timestamp
        : repairOrder.cancelledDate,

    invoicedDate:
      normalizedNextStatus === "Invoiced"
        ? timestamp
        : repairOrder.invoicedDate,
  };
}

export function getRepairOrderCurrentStatusDate(
  repairOrder: RepairOrder
): string | undefined {
  const dateField = getRepairOrderStatusDateField(repairOrder.status);

  return repairOrder[dateField];
}
export function applyRepairOrderStatusTransition(
  repairOrder: RepairOrder,
  nextStatus: RepairOrderStatus
): RepairOrder {
  const timestamp = new Date().toISOString();

  const normalizedStatus: RepairOrderStatus =
    nextStatus === "Waiting on Parts" ? "Waiting Parts" : nextStatus;

  return {
    ...repairOrder,
    status: normalizedStatus,
    draftDate:
      normalizedStatus === "Draft" ? timestamp : repairOrder.draftDate,
    openedDate:
      normalizedStatus === "Open" ? timestamp : repairOrder.openedDate,
    scheduledDate:
      normalizedStatus === "Scheduled" ? timestamp : repairOrder.scheduledDate,
    dispatchedDate:
      normalizedStatus === "Dispatched"
        ? timestamp
        : repairOrder.dispatchedDate,
    inProgressDate:
      normalizedStatus === "In Progress"
        ? timestamp
        : repairOrder.inProgressDate,
    waitingPartsDate:
      normalizedStatus === "Waiting Parts"
        ? timestamp
        : repairOrder.waitingPartsDate,
    waitingApprovalDate:
      normalizedStatus === "Waiting Approval"
        ? timestamp
        : repairOrder.waitingApprovalDate,
    completedDate:
      normalizedStatus === "Completed" ? timestamp : repairOrder.completedDate,
    closedDate:
      normalizedStatus === "Closed" ? timestamp : repairOrder.closedDate,
    invoicedDate:
      normalizedStatus === "Invoiced" ? timestamp : repairOrder.invoicedDate,
    cancelledDate:
      normalizedStatus === "Cancelled" ? timestamp : repairOrder.cancelledDate,
    updatedDate: timestamp,
  };
}