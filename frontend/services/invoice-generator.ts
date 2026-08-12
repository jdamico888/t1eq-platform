import type {
  RepairOrder,
  RepairOrderActionItem,
  RepairOrderLaborEntry,
  RepairOrderPartEntry,
} from "@/types/repair-order";

import type {
  Invoice,
  InvoiceCustomerSnapshot,
  InvoiceLineItem,
  InvoiceLineItemType,
} from "@/types/invoice";

export type GeneratedInvoice = Invoice;

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
  return typeof value === "string" ? value : fallback;
}

function optionalString(value: unknown): string | undefined {
  const valueString = safeString(value).trim();

  return valueString ? valueString : undefined;
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
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

function shouldKeepLineItem(
  quantity: number,
  unitPrice: number,
  total: number
): boolean {
  return quantity > 0 || unitPrice > 0 || total > 0;
}

function createLineItem({
  id,
  type,
  description,
  quantity,
  unitPrice,
  total,
  repairOrder,
  actionItem,
  sourceId,
  sourceType,
  notes,
}: {
  id: string;
  type: InvoiceLineItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  repairOrder: RepairOrder;
  actionItem?: RepairOrderActionItem;
  sourceId?: string;
  sourceType: InvoiceLineItem["sourceType"];
  notes?: string;
}): InvoiceLineItem | null {
  if (!shouldKeepLineItem(quantity, unitPrice, total)) {
    return null;
  }

  return {
    id,
    type,
    description,

    quantity,
    unitPrice,
    rate: unitPrice,
    total,

    repairOrderId: repairOrder.id,
    repairOrderNumber: getRepairOrderNumber(repairOrder),

    actionItemId: actionItem?.id,

    sourceId,
    sourceType,

    notes: optionalString(notes),
  };
}

function createGeneratedLaborLineItemFromActionItem(
  repairOrder: RepairOrder,
  actionItem: RepairOrderActionItem
): InvoiceLineItem | null {
  const quantity = safeNumber(
    actionItem.generatedLaborHours,
    safeNumber(actionItem.laborHours, safeNumber(actionItem.estimatedLaborHours))
  );
  const unitPrice = safeNumber(
    actionItem.generatedLaborRate,
    safeNumber(actionItem.laborRate)
  );
  const total = safeNumber(
    actionItem.generatedLaborTotal,
    safeNumber(actionItem.laborTotal, quantity * unitPrice)
  );

  return createLineItem({
    id: `generated-labor-${actionItem.id}`,
    type: "Labor",
    description: `Labor: ${getActionItemDescription(actionItem)}`,
    quantity,
    unitPrice,
    total,
    repairOrder,
    actionItem,
    sourceId: actionItem.id,
    sourceType: "Generated Labor",
    notes:
      actionItem.generatedLaborDescription ??
      actionItem.generationNotes ??
      actionItem.notes,
  });
}

function createGeneratedPartsLineItemFromActionItem(
  repairOrder: RepairOrder,
  actionItem: RepairOrderActionItem
): InvoiceLineItem | null {
  const total = safeNumber(
    actionItem.generatedPartsTotal,
    safeNumber(actionItem.partsTotal)
  );

  return createLineItem({
    id: `generated-parts-${actionItem.id}`,
    type: "Parts",
    description: `Parts: ${getActionItemDescription(actionItem)}`,
    quantity: total > 0 ? 1 : 0,
    unitPrice: total,
    total,
    repairOrder,
    actionItem,
    sourceId: actionItem.id,
    sourceType: "Generated Parts",
    notes:
      actionItem.generatedPartsDescription ??
      actionItem.partsRequired ??
      actionItem.generationNotes,
  });
}

function createGeneratedTravelLineItemFromActionItem(
  repairOrder: RepairOrder,
  actionItem: RepairOrderActionItem
): InvoiceLineItem | null {
  const miles = safeNumber(actionItem.generatedTravelMiles);
  const hours = safeNumber(actionItem.generatedTravelHours);
  const rate = safeNumber(actionItem.generatedTravelRate);

  const calculatedTravelTotal = miles * rate;

  const total = safeNumber(
    actionItem.generatedTravelTotal,
    calculatedTravelTotal
  );

  const quantity = miles > 0 ? miles : hours > 0 ? hours : total > 0 ? 1 : 0;
  const unitPrice =
    rate > 0 ? rate : quantity > 0 ? Number((total / quantity).toFixed(2)) : 0;

  return createLineItem({
    id: `generated-travel-${actionItem.id}`,
    type: "Travel",
    description: `Travel: ${getActionItemDescription(actionItem)}`,
    quantity,
    unitPrice,
    total,
    repairOrder,
    actionItem,
    sourceId: actionItem.id,
    sourceType: "Generated Travel",
    notes:
      actionItem.generatedTravelDescription ??
      actionItem.generationNotes,
  });
}

function createGeneratedMiscLineItemFromActionItem(
  repairOrder: RepairOrder,
  actionItem: RepairOrderActionItem
): InvoiceLineItem | null {
  const total = safeNumber(actionItem.generatedMiscTotal);

  return createLineItem({
    id: `generated-misc-${actionItem.id}`,
    type: "Misc",
    description: `Misc: ${getActionItemDescription(actionItem)}`,
    quantity: total > 0 ? 1 : 0,
    unitPrice: total,
    total,
    repairOrder,
    actionItem,
    sourceId: actionItem.id,
    sourceType: "Generated Misc",
    notes:
      actionItem.generatedMiscDescription ??
      actionItem.generationNotes,
  });
}

function createLineItemFromLaborEntry(
  repairOrder: RepairOrder,
  laborEntry: RepairOrderLaborEntry,
  actionItem?: RepairOrderActionItem
): InvoiceLineItem | null {
  const quantity = safeNumber(
    laborEntry.customerLaborHours,
    safeNumber(laborEntry.hours)
  );
  const unitPrice = safeNumber(
    laborEntry.customerLaborRate,
    safeNumber(laborEntry.laborRate)
  );
  const total = safeNumber(
    laborEntry.customerLaborTotal,
    safeNumber(laborEntry.total, quantity * unitPrice)
  );

  return createLineItem({
    id: `labor-entry-${laborEntry.id}`,
    type: "Labor",
    description:
      laborEntry.actionItemTitle ??
      (actionItem ? `Labor: ${getActionItemDescription(actionItem)}` : undefined) ??
      laborEntry.laborType ??
      "Labor",
    quantity,
    unitPrice,
    total,
    repairOrder,
    actionItem,
    sourceId: laborEntry.id,
    sourceType: "Labor Entry",
    notes: laborEntry.notes,
  });
}

function createLineItemFromPartEntry(
  repairOrder: RepairOrder,
  partEntry: RepairOrderPartEntry,
  actionItem?: RepairOrderActionItem
): InvoiceLineItem | null {
  const quantity = safeNumber(partEntry.quantity, 1);
  const unitPrice = safeNumber(
    partEntry.sellPrice ?? partEntry.unitPrice ?? partEntry.price
  );
  const total = safeNumber(partEntry.total, quantity * unitPrice);

  return createLineItem({
    id: `part-entry-${partEntry.id}`,
    type: "Parts",
    description: `${partEntry.partNumber} - ${partEntry.description}`,
    quantity,
    unitPrice,
    total,
    repairOrder,
    actionItem,
    sourceId: partEntry.id,
    sourceType: "Part Entry",
    notes: partEntry.notes,
  });
}

function buildActionItemInvoiceLines(
  repairOrder: RepairOrder,
  actionItem: RepairOrderActionItem
): InvoiceLineItem[] {
  const nestedLaborLines = (actionItem.laborEntries ?? [])
    .map((laborEntry) =>
      createLineItemFromLaborEntry(repairOrder, laborEntry, actionItem)
    )
    .filter((lineItem): lineItem is InvoiceLineItem => Boolean(lineItem));

  const nestedPartLines = (actionItem.partEntries ?? [])
    .map((partEntry) =>
      createLineItemFromPartEntry(repairOrder, partEntry, actionItem)
    )
    .filter((lineItem): lineItem is InvoiceLineItem => Boolean(lineItem));

  const generatedLaborLine =
    nestedLaborLines.length > 0
      ? null
      : createGeneratedLaborLineItemFromActionItem(repairOrder, actionItem);

  const generatedPartsLine =
    nestedPartLines.length > 0
      ? null
      : createGeneratedPartsLineItemFromActionItem(repairOrder, actionItem);

  const generatedTravelLine = createGeneratedTravelLineItemFromActionItem(
    repairOrder,
    actionItem
  );

  const generatedMiscLine = createGeneratedMiscLineItemFromActionItem(
    repairOrder,
    actionItem
  );

  return [
    generatedLaborLine,
    generatedPartsLine,
    generatedTravelLine,
    generatedMiscLine,
    ...nestedLaborLines,
    ...nestedPartLines,
  ].filter((lineItem): lineItem is InvoiceLineItem => Boolean(lineItem));
}

function buildInvoiceLineItems(repairOrder: RepairOrder): InvoiceLineItem[] {
  const actionItemLines = repairOrder.actionItems.flatMap((actionItem) =>
    buildActionItemInvoiceLines(repairOrder, actionItem)
  );

  const laborEntryLines = repairOrder.laborEntries
    .filter((laborEntry) => !laborEntry.actionItemId)
    .map((laborEntry) => createLineItemFromLaborEntry(repairOrder, laborEntry))
    .filter((lineItem): lineItem is InvoiceLineItem => Boolean(lineItem));

  const partEntryLines = (repairOrder.partEntries ?? [])
    .map((partEntry) => createLineItemFromPartEntry(repairOrder, partEntry))
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

function buildCustomerSnapshot(
  repairOrder: RepairOrder
): InvoiceCustomerSnapshot {
  return {
    customerId: repairOrder.customerId,
    customerName: getCustomerName(repairOrder),
    contactName: getContactName(repairOrder),
    phone: getPhone(repairOrder),
    email: getEmail(repairOrder),
    billingAddress: getBillingAddress(repairOrder),
    serviceAddress: getServiceAddress(repairOrder),
  };
}

export function generateInvoiceFromRepairOrder(
  repairOrder: RepairOrder,
  taxRate = 0
): GeneratedInvoice {
  const now = createTimestamp();
  const lineItems = buildInvoiceLineItems(repairOrder);

  const subtotalLabor = calculateSubtotalByType(lineItems, "Labor");
  const subtotalParts = calculateSubtotalByType(lineItems, "Parts");
  const subtotal = lineItems.reduce(
    (total, lineItem) => total + lineItem.total,
    0
  );
  const subtotalOther = subtotal - subtotalLabor - subtotalParts;

  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  return {
    id: createId("INV"),
    invoiceNumber: createInvoiceNumber(repairOrder),

    repairOrderId: repairOrder.id,
    repairOrderNumber: getRepairOrderNumber(repairOrder),
    repairOrderRO: repairOrder.ro,

    customerId: repairOrder.customerId ?? "",
    customerName: getCustomerName(repairOrder),
    customer: getCustomerName(repairOrder),
    customerSnapshot: buildCustomerSnapshot(repairOrder),

    siteId: repairOrder.siteId,
    siteName: getSiteName(repairOrder),

    equipmentId: repairOrder.equipmentId,
    equipmentName: getEquipmentName(repairOrder),
    equipmentDescription: getEquipmentDescription(repairOrder),

    complaint: getComplaint(repairOrder),
    customerConcern: getCustomerConcern(repairOrder),
    workPerformed: getWorkPerformed(repairOrder),
    recommendations: getRecommendations(repairOrder),

    subtotalLabor,
    subtotalParts,
    subtotalOther,

    subtotal,

    taxRate,
    tax: taxAmount,
    taxAmount,

    totalAmount,
    total: totalAmount,

    amountPaid: 0,
    balanceDue: totalAmount,

    status: "Draft",

    invoiceDate: now,
    issuedDate: now,

    lineItems,

    notes: getNotes(repairOrder),

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