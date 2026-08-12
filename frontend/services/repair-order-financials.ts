import type {
  RepairOrder,
  RepairOrderActionItem,
  RepairOrderBillingGroup,
  RepairOrderLaborEntry,
  RepairOrderPartEntry,
} from "@/types/repair-order";

export type RepairOrderBillingGroupTotals = Record<
  RepairOrderBillingGroup,
  number
>;

export type RepairOrderActionItemFinancials = {
  actionItemId: string;
  title: string;
  billingGroup: RepairOrderBillingGroup;
  laborHours: number;
  laborRate: number;
  laborTotal: number;
  partsTotal: number;
  otherTotal: number;
  total: number;
};

export type RepairOrderFinancials = {
  repairOrderId: string;
  repairOrderNumber: string;

  billingGroupTotals: RepairOrderBillingGroupTotals;
  actionItemTotals: RepairOrderActionItemFinancials[];

  actionItemCount: number;
  billableActionItemCount: number;

  subtotalLabor: number;
  subtotalParts: number;
  subtotalOther: number;
  subtotal: number;

  totalLabor: number;
  totalParts: number;
  totalOther: number;

  laborTotal: number;
  partsTotal: number;
  otherTotal: number;

  inspectionCharges: number;
  repairCharges: number;
  partsCharges: number;
  otherCharges: number;

  totalAmount: number;
  total: number;
};

export type RepairOrderFinancialSummary = RepairOrderFinancials;

function safeNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return parsedValue;
}

function getRepairOrderNumber(repairOrder: RepairOrder): string {
  return repairOrder.repairOrderNumber || repairOrder.ro || repairOrder.id;
}

export function formatCurrency(value: number | undefined | null): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(safeNumber(value));
}

export function createEmptyRepairOrderBillingGroupTotals(): RepairOrderBillingGroupTotals {
  return {
    Inspection: 0,
    Repair: 0,
    Parts: 0,
    Other: 0,
    Labor: 0,
    Travel: 0,
    Mileage: 0,
    "Inspection Charges": 0,
    "Repair Charges": 0,
    "Parts Charges": 0,
    "Other Charges": 0,
  };
}

export const EMPTY_REPAIR_ORDER_BILLING_GROUP_TOTALS =
  createEmptyRepairOrderBillingGroupTotals();

function normalizeBillingGroup(
  billingGroup: RepairOrderBillingGroup | string | undefined
): RepairOrderBillingGroup {
  if (billingGroup === "Inspection") {
    return "Inspection";
  }

  if (billingGroup === "Repair") {
    return "Repair";
  }

  if (billingGroup === "Parts") {
    return "Parts";
  }

  if (billingGroup === "Other") {
    return "Other";
  }

  if (billingGroup === "Labor") {
    return "Labor";
  }

  if (billingGroup === "Travel") {
    return "Travel";
  }

  if (billingGroup === "Mileage") {
    return "Mileage";
  }

  if (billingGroup === "Inspection Charges") {
    return "Inspection Charges";
  }

  if (billingGroup === "Repair Charges") {
    return "Repair Charges";
  }

  if (billingGroup === "Parts Charges") {
    return "Parts Charges";
  }

  if (billingGroup === "Other Charges") {
    return "Other Charges";
  }

  return "Repair Charges";
}

function getLaborEntryTotal(laborEntry: RepairOrderLaborEntry): number {
  const hours = safeNumber(laborEntry.hours);
  const rate = safeNumber(laborEntry.laborRate);

  return safeNumber(laborEntry.total, hours * rate);
}

function getPartEntryTotal(partEntry: RepairOrderPartEntry): number {
  const quantity = safeNumber(partEntry.quantity, 1);
  const unitPrice = safeNumber(
    partEntry.sellPrice ?? partEntry.unitPrice ?? partEntry.price
  );

  return safeNumber(partEntry.total, quantity * unitPrice);
}

function getActionItemLaborTotal(actionItem: RepairOrderActionItem): number {
  const laborEntryTotal = (actionItem.laborEntries ?? []).reduce(
    (total, laborEntry) => total + getLaborEntryTotal(laborEntry),
    0
  );

  const laborHours = safeNumber(
    actionItem.laborHours,
    safeNumber(actionItem.estimatedLaborHours)
  );
  const laborRate = safeNumber(actionItem.laborRate);
  const calculatedLaborTotal = laborHours * laborRate;

  return safeNumber(
    actionItem.laborTotal,
    laborEntryTotal || calculatedLaborTotal
  );
}

function getActionItemPartsTotal(actionItem: RepairOrderActionItem): number {
  const partEntryTotal = (actionItem.partEntries ?? []).reduce(
    (total, partEntry) => total + getPartEntryTotal(partEntry),
    0
  );

  return safeNumber(actionItem.partsTotal, partEntryTotal);
}

function getActionItemTotal(actionItem: RepairOrderActionItem): number {
  const laborTotal = getActionItemLaborTotal(actionItem);
  const partsTotal = getActionItemPartsTotal(actionItem);

  return safeNumber(actionItem.total, laborTotal + partsTotal);
}

function isBillableActionItem(actionItem: RepairOrderActionItem): boolean {
  return getActionItemTotal(actionItem) > 0;
}

function addToBillingGroupTotals(
  totals: RepairOrderBillingGroupTotals,
  billingGroup: RepairOrderBillingGroup | string | undefined,
  amount: number
) {
  const normalizedBillingGroup = normalizeBillingGroup(billingGroup);

  totals[normalizedBillingGroup] += safeNumber(amount);
}

export function calculateRepairOrderActionItemFinancials(
  actionItem: RepairOrderActionItem
): RepairOrderActionItemFinancials {
  const laborHours = safeNumber(
    actionItem.laborHours,
    safeNumber(actionItem.estimatedLaborHours)
  );
  const laborRate = safeNumber(actionItem.laborRate);
  const laborTotal = getActionItemLaborTotal(actionItem);
  const partsTotal = getActionItemPartsTotal(actionItem);
  const total = getActionItemTotal(actionItem);
  const otherTotal = Math.max(total - laborTotal - partsTotal, 0);

  return {
    actionItemId: actionItem.id,
    title: actionItem.title,
    billingGroup: normalizeBillingGroup(actionItem.billingGroup),
    laborHours,
    laborRate,
    laborTotal,
    partsTotal,
    otherTotal,
    total,
  };
}

export function getRepairOrderBillingGroupTotals(
  repairOrder: RepairOrder
): RepairOrderBillingGroupTotals {
  const billingGroupTotals = createEmptyRepairOrderBillingGroupTotals();

  repairOrder.actionItems.forEach((actionItem) => {
    const billingGroup = normalizeBillingGroup(actionItem.billingGroup);
    const actionItemTotal = getActionItemTotal(actionItem);

    addToBillingGroupTotals(billingGroupTotals, billingGroup, actionItemTotal);
  });

  (repairOrder.laborEntries ?? []).forEach((laborEntry) => {
    addToBillingGroupTotals(
      billingGroupTotals,
      laborEntry.billingGroup ?? "Repair Charges",
      getLaborEntryTotal(laborEntry)
    );
  });

  (repairOrder.partEntries ?? []).forEach((partEntry) => {
    addToBillingGroupTotals(
      billingGroupTotals,
      "Parts Charges",
      getPartEntryTotal(partEntry)
    );
  });

  return billingGroupTotals;
}

export function calculateRepairOrderFinancials(
  repairOrder: RepairOrder
): RepairOrderFinancials {
  const actionItemTotals = repairOrder.actionItems.map(
    calculateRepairOrderActionItemFinancials
  );

  const actionItemLaborTotal = actionItemTotals.reduce(
    (total, actionItem) => total + actionItem.laborTotal,
    0
  );

  const actionItemPartsTotal = actionItemTotals.reduce(
    (total, actionItem) => total + actionItem.partsTotal,
    0
  );

  const actionItemOtherTotal = actionItemTotals.reduce(
    (total, actionItem) => total + actionItem.otherTotal,
    0
  );

  const topLevelLaborTotal = (repairOrder.laborEntries ?? []).reduce(
    (total, laborEntry) => total + getLaborEntryTotal(laborEntry),
    0
  );

  const topLevelPartsTotal = (repairOrder.partEntries ?? []).reduce(
    (total, partEntry) => total + getPartEntryTotal(partEntry),
    0
  );

  const subtotalLabor = safeNumber(
    repairOrder.subtotalLabor,
    actionItemLaborTotal + topLevelLaborTotal
  );

  const subtotalParts = safeNumber(
    repairOrder.subtotalParts,
    actionItemPartsTotal + topLevelPartsTotal
  );

  const subtotalOther = safeNumber(
    repairOrder.subtotalOther,
    actionItemOtherTotal
  );

  const subtotal = subtotalLabor + subtotalParts + subtotalOther;
  const totalAmount = safeNumber(repairOrder.totalAmount, subtotal);
  const billingGroupTotals = getRepairOrderBillingGroupTotals(repairOrder);

  const actionItemCount = repairOrder.actionItems.length;
  const billableActionItemCount = repairOrder.actionItems.filter(
    isBillableActionItem
  ).length;

  return {
    repairOrderId: repairOrder.id,
    repairOrderNumber: getRepairOrderNumber(repairOrder),

    billingGroupTotals,
    actionItemTotals,

    actionItemCount,
    billableActionItemCount,

    subtotalLabor,
    subtotalParts,
    subtotalOther,
    subtotal,

    totalLabor: subtotalLabor,
    totalParts: subtotalParts,
    totalOther: subtotalOther,

    laborTotal: subtotalLabor,
    partsTotal: subtotalParts,
    otherTotal: subtotalOther,

    inspectionCharges: billingGroupTotals["Inspection Charges"],
    repairCharges: billingGroupTotals["Repair Charges"],
    partsCharges: billingGroupTotals["Parts Charges"],
    otherCharges: billingGroupTotals["Other Charges"],

    totalAmount,
    total: totalAmount,
  };
}

export function calculateRepairOrderFinancialSummary(
  repairOrder: RepairOrder
): RepairOrderFinancialSummary {
  return calculateRepairOrderFinancials(repairOrder);
}

export function getRepairOrderFinancials(
  repairOrder: RepairOrder
): RepairOrderFinancials {
  return calculateRepairOrderFinancials(repairOrder);
}

export function getRepairOrderFinancialSummary(
  repairOrder: RepairOrder
): RepairOrderFinancialSummary {
  return calculateRepairOrderFinancialSummary(repairOrder);
}

export function calculateRepairOrderTotals(
  repairOrder: RepairOrder
): RepairOrderFinancials {
  return calculateRepairOrderFinancials(repairOrder);
}

export function getRepairOrderSubtotal(repairOrder: RepairOrder): number {
  return calculateRepairOrderFinancials(repairOrder).subtotal;
}

export function getRepairOrderTotal(repairOrder: RepairOrder): number {
  return calculateRepairOrderFinancials(repairOrder).totalAmount;
}

export function getRepairOrderLaborTotal(repairOrder: RepairOrder): number {
  return calculateRepairOrderFinancials(repairOrder).subtotalLabor;
}

export function getRepairOrderPartsTotal(repairOrder: RepairOrder): number {
  return calculateRepairOrderFinancials(repairOrder).subtotalParts;
}

export function getRepairOrderOtherTotal(repairOrder: RepairOrder): number {
  return calculateRepairOrderFinancials(repairOrder).subtotalOther;
}