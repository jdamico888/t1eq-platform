import type { RepairOrder } from "@/types/repair-orders";

export type RepairOrderDispatchReadinessIssue = {
  id: string;
  label: string;
  severity: "Info" | "Warning" | "Blocking";
};

export type RepairOrderDispatchReadinessSummary = {
  isReadyForDispatch: boolean;
  blockingIssueCount: number;
  warningIssueCount: number;
  issues: RepairOrderDispatchReadinessIssue[];
};

const nonDispatchableStatuses = ["Closed", "Cancelled", "Invoiced"];

export const calculateRepairOrderDispatchReadiness = (
  repairOrder: RepairOrder
): RepairOrderDispatchReadinessSummary => {
  const issues: RepairOrderDispatchReadinessIssue[] = [];

  if (nonDispatchableStatuses.includes(repairOrder.status)) {
    issues.push({
      id: "status-not-dispatchable",
      label: `Repair order status is ${repairOrder.status}.`,
      severity: "Blocking",
    });
  }

  if (!repairOrder.customerId && !repairOrder.customerName) {
    issues.push({
      id: "missing-customer",
      label: "Customer is required before dispatch.",
      severity: "Blocking",
    });
  }

  if (!repairOrder.equipmentId && !repairOrder.equipmentName) {
    issues.push({
      id: "missing-equipment",
      label: "Equipment is required before dispatch.",
      severity: "Blocking",
    });
  }

  if (!repairOrder.assignedTechnicianId && !repairOrder.assignedTechnicianName) {
    issues.push({
      id: "missing-technician",
      label: "Technician assignment is required before dispatch.",
      severity: "Blocking",
    });
  }

  if (!repairOrder.scheduledDate) {
    issues.push({
      id: "missing-scheduled-date",
      label: "Scheduled date is recommended before dispatch.",
      severity: "Warning",
    });
  }

  if (repairOrder.actionItems.length === 0) {
    issues.push({
      id: "missing-action-items",
      label: "At least one action item is recommended before dispatch.",
      severity: "Warning",
    });
  }

  if (!repairOrder.customerConcern?.trim() && !repairOrder.complaint?.trim()) {
    issues.push({
      id: "missing-customer-concern",
      label: "Customer concern should be documented before dispatch.",
      severity: "Warning",
    });
  }

  const blockingIssueCount = issues.filter(
    (issue) => issue.severity === "Blocking"
  ).length;

  const warningIssueCount = issues.filter(
    (issue) => issue.severity === "Warning"
  ).length;

  return {
    isReadyForDispatch: blockingIssueCount === 0,
    blockingIssueCount,
    warningIssueCount,
    issues,
  };
};