import type {
  RepairOrderActionItemStatus,
  RepairOrderActionItemType,
  RepairOrderBillingGroup,
  RepairOrderPriority,
  RepairOrderStatus,
} from "@/types/repair-order";

export const REPAIR_ORDER_STATUSES: RepairOrderStatus[] = [
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

export const ACTIVE_REPAIR_ORDER_STATUSES: RepairOrderStatus[] = [
  "Draft",
  "Open",
  "Scheduled",
  "Dispatched",
  "In Progress",
  "Waiting Parts",
  "Waiting Approval",
];

export const CLOSED_REPAIR_ORDER_STATUSES: RepairOrderStatus[] = [
  "Completed",
  "Closed",
  "Invoiced",
  "Cancelled",
];

export const REPAIR_ORDER_PRIORITIES: RepairOrderPriority[] = [
  "Low",
  "Normal",
  "High",
  "Urgent",
];

export const REPAIR_ORDER_ACTION_ITEM_TYPES: RepairOrderActionItemType[] = [
  "Installation",
  "Inspection",
  "Repair",
  "Removal",
  "Diagnosis",
  "Calibration",
  "Parts",
  "Recommendation",
  "Follow-Up",
  "Follow Up",
  "Other",
];

/**
 * The customer-facing request categories offered by default when adding a
 * new action item (Line) to a repair order or appointment. This is a subset
 * of RepairOrderActionItemType — the full type list above still supports the
 * additional internal classifications (Diagnosis, Calibration, etc.) used by
 * existing action items and billing/scheduling logic.
 */
export const REPAIR_ORDER_CUSTOMER_REQUEST_CATEGORIES: RepairOrderActionItemType[] =
  ["Installation", "Inspection", "Repair", "Removal"];

export const REPAIR_ORDER_ACTION_ITEM_STATUSES: RepairOrderActionItemStatus[] = [
  "Open",
  "In Progress",
  "Waiting Parts",
  "Waiting Approval",
  "Completed",
  "Deferred",
  "Declined",
  "Cancelled",
];

export const REPAIR_ORDER_BILLING_GROUPS: RepairOrderBillingGroup[] = [
  "Inspection Charges",
  "Repair Charges",
  "Parts Charges",
  "Other Charges",
];

export const DEFAULT_BILLING_GROUP_BY_ACTION_TYPE: Record<
  RepairOrderActionItemType,
  RepairOrderBillingGroup
> = {
  Installation: "Repair Charges",
  Inspection: "Inspection Charges",
  Repair: "Repair Charges",
  Removal: "Repair Charges",
  Diagnosis: "Repair Charges",
  Calibration: "Repair Charges",
  Parts: "Parts Charges",
  Recommendation: "Other Charges",
  "Follow-Up": "Other Charges",
  "Follow Up": "Other Charges",
  Other: "Other Charges",
};

export const DEFAULT_REPAIR_ORDER_ACTION_BILLING_GROUP_BY_TYPE =
  DEFAULT_BILLING_GROUP_BY_ACTION_TYPE;

/**
 * Legacy export names still used by older RO components.
 */
export const REPAIR_ORDER_ACTION_TYPES = REPAIR_ORDER_ACTION_ITEM_TYPES;

export const REPAIR_ORDER_ACTION_STATUSES =
  REPAIR_ORDER_ACTION_ITEM_STATUSES;

export const REPAIR_ORDER_ACTION_BILLING_GROUP_BY_TYPE =
  DEFAULT_BILLING_GROUP_BY_ACTION_TYPE;

export function getDefaultRepairOrderBillingGroup(
  actionType: RepairOrderActionItemType
): RepairOrderBillingGroup {
  return DEFAULT_BILLING_GROUP_BY_ACTION_TYPE[actionType];
}

export function normalizeRepairOrderActionItemTypeLabel(
  actionType: RepairOrderActionItemType
): string {
  if (actionType === "Follow-Up") {
    return "Follow Up";
  }

  return actionType;
}