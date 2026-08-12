import type {
  RepairOrder,
  RepairOrderActionItem,
  RepairOrderLaborEntry,
  RepairOrderPartEntry,
} from "@/types/repair-order";

export type InvoiceLineItemType =
  | "Labor"
  | "Parts"
  | "Inspection"
  | "Repair"
  | "Other";

export type InvoiceLineItem = {
  id: string;
  type: InvoiceLineItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sourceId?: string;
  notes?: string;
};

export type InvoiceCustomerSnapshot = {
  customerId?: string;
  customerName: string;
  contactName: string;
  phone: string;
  email: string;
  billingAddress: string;
  serviceAddress: string;
};

export type GeneratedInvoice = {
  id: string;
  invoiceNumber: string;

  repairOrderId: string;
  repairOrderNumber: string;

  customerId?: string;
  customerName: string;
  customerSnapshot: InvoiceCustomerSnapshot;

  siteId?: string;
  siteName: string;

  equipmentId?: string;
  equipmentName: string;
  equipmentDescription: string;

  complaint: string;
  customerConcern: string;
  workPerformed: string;
  recommendations: string;
  notes: string;

  lineItems: InvoiceLineItem[];

  subtotalLabor: number;
  subtotalParts: number;
  subtotalOther: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;

  status: "Draft" | "Issued" | "Paid" | "Void";

  createdDate: string;
  updatedDate: string;
};

export type Invoice = GeneratedInvoice;

function createId(prefix = "INV") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function safeString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value;
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return parsedValue;
}

function createInvoiceNumber(repairOrder: RepairOrder): string {
  const repairOrderNumber =
    repairOrder.repairOrderNumber || repairOrder.ro || repairOrder.id;

  return `INV-${repairOrderNumber.replace(/^RO-?/i, "")}`;
}

function getRepairOrderNumber(repairOrder: RepairOrder): string {
  return repairOrder.repairOrderNumber || repairOrder.ro || repairOrder.id;
}

function getCustomerName(repairOrder: RepairOrder): string {
  return (
    repairOrder.customerName ||
    repairOrder.customerSnapshot.customerName ||
    "Unknown Customer"
  );
}

function getContactName(repairOrder: RepairOrder): string {
  return repairOrder.customerSnapshot.contactName ?? "";
}

function getPhone(repairOrder: RepairOrder): string {
  return repairOrder.customerSnapshot.phone ?? "";
}

function getEmail(repairOrder: RepairOrder): string {
  return repairOrder.customerSnapshot.email ?? "";
}

function getBillingAddress(repairOrder: RepairOrder): string {
  return repairOrder.customerSnapshot.billingAddress ?? "";
}

function getServiceAddress(repairOrder: RepairOrder): string {
  return (
    repairOrder.customerSnapshot.serviceAddress ??
    repairOrder.siteName ??
    repairOrder.equipmentSnapshot?.locationName ??
    ""
  );
}

function getSiteName(repairOrder: RepairOrder): string {
  return repairOrder.siteName ?? repairOrder.equipmentSnapshot?.locationName ?? "";
}

function getEquipmentName(repairOrder: RepairOrder): string {
  return repairOrder.equipmentName ?? repairOrder.equipmentSnapshot?.equipmentName ?? "";
}

function getEquipmentDescription(repairOrder: RepairOrder): string {
  return (
    repairOrder.equipmentDescription ??
    repairOrder.equipmentSnapshot?.equipmentDescription ??
    [
      repairOrder.equipmentSnapshot?.manufacturer,
      repairOrder.equipmentSnapshot?.model,
      repairOrder.equipmentSnapshot?.serialNumber,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getComplaint(repairOrder: RepairOrder): string {
  return (
    repairOrder.complaint ??
    repairOrder.customerConcern ??
    repairOrder.concern ??
    ""
  );
}

function getCustomerConcern(repairOrder: RepairOrder): string {
  return (
    repairOrder.customerConcern ??
    repairOrder.concern ??
    repairOrder.complaint ??
    ""
  );
}

function getWorkPerformed(repairOrder: RepairOrder): string {
  return (
    repairOrder.workPerformed ??
    repairOrder.resolution ??
    repairOrder.correction ??
    ""
  );
}

function getRecommendations(repairOrder: RepairOrder): string {
  return repairOrder.recommendations ?? "";
}

function getNotes(repairOrder: RepairOrder): string {
  return repairOrder.notes ?? repairOrder.internalNotes ?? repairOrder.customerNotes ?? "";
}

function getActionItemDescription(actionItem: RepairOrderActionItem): string {
  return actionItem.title || actionItem.description || actionItem.type;
}

function createLaborLineItemFromActionItem(
  actionItem: RepairOrderActionItem
): InvoiceLineItem | null {
  const quantity = safeNumber(
    actionItem.laborHours,
    safeNumber(actionItem.estimatedLaborHours)
  );
  const unitPrice = safeNumber(actionItem.laborRate);
  const total = safeNumber(actionItem.laborTotal, quantity * unitPrice);

  if (quantity <= 0 && unitPrice <= 0 && total <= 0) {
    return null;
  }

  return {
    id: `labor-action-${actionItem.id}`,
    type: "Labor",
    description: `${getActionItemDescription(actionItem)} labor`,
    quantity,
    unitPrice,
    total,
    sourceId: actionItem.id,
    notes: actionItem.notes ?? actionItem.completionNotes,
  };
}

function createPartsLineItemFromActionItem(
  actionItem: RepairOrderActionItem
): InvoiceLineItem | null {
  const total = safeNumber(actionItem.partsTotal);

  if (total <= 0) {
    return null;
  }

  return {
    id: `parts-action-${actionItem.id}`,
    type: "Parts",
    description: `${getActionItemDescription(actionItem)} parts`,
    quantity: 1,
    unitPrice: total,
    total,
    sourceId: actionItem.id,
    notes: actionItem.partsRequired,
  };
}

function createLineItemFromLaborEntry(
  laborEntry: RepairOrderLaborEntry
): InvoiceLineItem | null {
  const quantity = safeNumber(laborEntry.hours);
  const unitPrice = safeNumber(laborEntry.laborRate);
  const total = safeNumber(laborEntry.total, quantity * unitPrice);

  if (quantity <= 0 && unitPrice <= 0 && total <= 0) {
    return null;
  }

  return {
    id: `labor-entry-${laborEntry.id}`,
    type: "Labor",
    description:
      laborEntry.actionItemTitle ??
      laborEntry.laborType ??
      "Labor",
    quantity,
    unitPrice,
    total,
    sourceId: laborEntry.id,
    notes: laborEntry.notes,
  };
}

function createLineItemFromPartEntry(
  partEntry: RepairOrderPartEntry
): InvoiceLineItem | null {
  const quantity = safeNumber(partEntry.quantity, 1);
  const unitPrice = safeNumber(
    partEntry.sellPrice ?? partEntry.unitPrice ?? partEntry.price
  );
  const total = safeNumber(partEntry.total, quantity * unitPrice);

  if (quantity <= 0 && unitPrice <= 0 && total <= 0) {
    return null;
  }

  return {
    id: `part-entry-${partEntry.id}`,
    type: "Parts",
    description: `${partEntry.partNumber} - ${partEntry.description}`,
    quantity,
    unitPrice,
    total,
    sourceId: partEntry.id,
    notes: partEntry.notes,
  };
}

function buildInvoiceLineItems(repairOrder: RepairOrder): InvoiceLineItem[] {
  const actionItemLines = repairOrder.actionItems.flatMap((actionItem) => {
    const lines: InvoiceLineItem[] = [];

    const laborLine = createLaborLineItemFromActionItem(actionItem);
    const partsLine = createPartsLineItemFromActionItem(actionItem);

    if (laborLine) {
      lines.push(laborLine);
    }

    if (partsLine) {
      lines.push(partsLine);
    }

    const nestedLaborLines = (actionItem.laborEntries ?? [])
      .map(createLineItemFromLaborEntry)
      .filter((lineItem): lineItem is InvoiceLineItem => Boolean(lineItem));

    const nestedPartLines = (actionItem.partEntries ?? [])
      .map(createLineItemFromPartEntry)
      .filter((lineItem): lineItem is InvoiceLineItem => Boolean(lineItem));

    return [...lines, ...nestedLaborLines, ...nestedPartLines];
  });

  const laborEntryLines = repairOrder.laborEntries
    .map(createLineItemFromLaborEntry)
    .filter((lineItem): lineItem is InvoiceLineItem => Boolean(lineItem));

  const partEntryLines = (repairOrder.partEntries ?? [])
    .map(createLineItemFromPartEntry)
    .filter((lineItem): lineItem is InvoiceLineItem => Boolean(lineItem));

  return [...actionItemLines, ...laborEntryLines, ...partEntryLines];
}

function calculateSubtotalByType(
  lineItems: InvoiceLineItem[],
  type: InvoiceLineItemType
): number {
  return lineItems
    .filter((lineItem) => lineItem.type === type)
    .reduce((total, lineItem) => total + lineItem.total, 0);
}

export function generateInvoiceFromRepairOrder(
  repairOrder: RepairOrder,
  taxRate = 0
): GeneratedInvoice {
  const now = createTimestamp();
  const lineItems = buildInvoiceLineItems(repairOrder);

  const lineItemLaborSubtotal = calculateSubtotalByType(lineItems, "Labor");
  const lineItemPartsSubtotal = calculateSubtotalByType(lineItems, "Parts");
  const lineItemOtherSubtotal =
    lineItems.reduce((total, lineItem) => total + lineItem.total, 0) -
    lineItemLaborSubtotal -
    lineItemPartsSubtotal;

  const subtotalLabor = safeNumber(
    repairOrder.subtotalLabor,
    lineItemLaborSubtotal
  );
  const subtotalParts = safeNumber(
    repairOrder.subtotalParts,
    lineItemPartsSubtotal
  );
  const subtotalOther = safeNumber(
    repairOrder.subtotalOther,
    lineItemOtherSubtotal
  );

  const subtotal = subtotalLabor + subtotalParts + subtotalOther;
  const taxAmount = subtotal * taxRate;
  const totalAmount = safeNumber(
    repairOrder.totalAmount,
    subtotal + taxAmount
  );

  return {
    id: createId("INV"),
    invoiceNumber: createInvoiceNumber(repairOrder),

    repairOrderId: repairOrder.id,
    repairOrderNumber: getRepairOrderNumber(repairOrder),

    customerId: repairOrder.customerId,
    customerName: getCustomerName(repairOrder),
    customerSnapshot: {
      customerId: repairOrder.customerId,
      customerName: getCustomerName(repairOrder),
      contactName: getContactName(repairOrder),
      phone: getPhone(repairOrder),
      email: getEmail(repairOrder),
      billingAddress: getBillingAddress(repairOrder),
      serviceAddress: getServiceAddress(repairOrder),
    },

    siteId: repairOrder.siteId,
    siteName: getSiteName(repairOrder),

    equipmentId: repairOrder.equipmentId,
    equipmentName: getEquipmentName(repairOrder),
    equipmentDescription: getEquipmentDescription(repairOrder),

    complaint: getComplaint(repairOrder),
    customerConcern: getCustomerConcern(repairOrder),
    workPerformed: getWorkPerformed(repairOrder),
    recommendations: getRecommendations(repairOrder),
    notes: getNotes(repairOrder),

    lineItems,

    subtotalLabor,
    subtotalParts,
    subtotalOther,
    subtotal,
    taxRate,
    taxAmount,
    totalAmount,

    status: "Draft",

    createdDate: now,
    updatedDate: now,
  };
}

export function createInvoiceFromRepairOrder(
  repairOrder: RepairOrder,
  taxRate = 0
): GeneratedInvoice {
  return generateInvoiceFromRepairOrder(repairOrder, taxRate);
}

export function buildInvoiceFromRepairOrder(
  repairOrder: RepairOrder,
  taxRate = 0
): GeneratedInvoice {
  return generateInvoiceFromRepairOrder(repairOrder, taxRate);
}

export function generateInvoice(
  repairOrder: RepairOrder,
  taxRate = 0
): GeneratedInvoice {
  return generateInvoiceFromRepairOrder(repairOrder, taxRate);
}