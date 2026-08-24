import type {
  Invoice,
  InvoiceLineItem,
  InvoiceLineItemType,
  InvoiceStatus,
} from "@/types/invoice";

export type { Invoice, InvoiceLineItem };

export type InvoiceInput = Partial<Invoice> & Record<string, unknown>;

const STORAGE_KEY = "t1eq-invoices";

function createId(prefix = "INV") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function optionalString(value: unknown): string | undefined {
  const stringValue = safeString(value).trim();

  return stringValue ? stringValue : undefined;
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizeInvoiceStatus(value: unknown): InvoiceStatus {
  if (
    value === "Draft" ||
    value === "Open" ||
    value === "Issued" ||
    value === "Paid" ||
    value === "Partial" ||
    value === "Overdue" ||
    value === "Cancelled" ||
    value === "Void"
  ) {
    return value;
  }

  return "Draft";
}

function normalizeLineItemType(value: unknown): InvoiceLineItemType {
  if (
    value === "Labor" ||
    value === "Parts" ||
    value === "Travel" ||
    value === "Misc" ||
    value === "Inspection" ||
    value === "Repair" ||
    value === "Other"
  ) {
    return value;
  }

  return "Other";
}

function normalizeInvoiceLineItem(
  lineItem: Partial<InvoiceLineItem>
): InvoiceLineItem {
  const quantity = safeNumber(lineItem.quantity, 1);
  const unitPrice = safeNumber(lineItem.unitPrice ?? lineItem.rate);
  const total = safeNumber(lineItem.total, quantity * unitPrice);

  return {
    id: safeString(lineItem.id, createId("LINE")),
    type: normalizeLineItemType(lineItem.type),
    description: safeString(lineItem.description, "Invoice line item"),

    quantity,

    unitPrice,
    rate: lineItem.rate === undefined ? unitPrice : safeNumber(lineItem.rate),

    total,

    repairOrderId: optionalString(lineItem.repairOrderId),
    repairOrderNumber: optionalString(lineItem.repairOrderNumber),

    actionItemId: optionalString(lineItem.actionItemId),

    sourceId: optionalString(lineItem.sourceId),
    sourceType: lineItem.sourceType,

    notes: optionalString(lineItem.notes),
  };
}

function normalizeInvoiceLineItems(value: unknown): InvoiceLineItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (lineItem): lineItem is Partial<InvoiceLineItem> => Boolean(lineItem)
    )
    .map(normalizeInvoiceLineItem);
}

function calculateSubtotalByType(
  lineItems: InvoiceLineItem[],
  type: InvoiceLineItemType
): number {
  return lineItems
    .filter((lineItem) => lineItem.type === type)
    .reduce((total, lineItem) => total + lineItem.total, 0);
}

export function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[] = [],
  taxRate = 0
) {
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
    subtotalLabor,
    subtotalParts,
    subtotalOther,
    subtotal,
    tax: taxAmount,
    taxAmount,
    total: totalAmount,
    totalAmount,
  };
}

function normalizeInvoice(invoice: InvoiceInput): Invoice {
  const timestamp = createTimestamp();

  const lineItems = normalizeInvoiceLineItems(invoice.lineItems);

  const taxRate = safeNumber(invoice.taxRate);
  const calculatedTotals = calculateInvoiceTotals(lineItems, taxRate);

  const subtotalLabor = safeNumber(
    invoice.subtotalLabor,
    calculatedTotals.subtotalLabor
  );
  const subtotalParts = safeNumber(
    invoice.subtotalParts,
    calculatedTotals.subtotalParts
  );
  const subtotalOther = safeNumber(
    invoice.subtotalOther,
    calculatedTotals.subtotalOther
  );

  const subtotal = safeNumber(
    invoice.subtotal,
    subtotalLabor + subtotalParts + subtotalOther
  );

  const taxAmount = safeNumber(
    invoice.taxAmount ?? invoice.tax,
    subtotal * taxRate
  );

  const totalAmount = safeNumber(
    invoice.totalAmount ?? invoice.total,
    subtotal + taxAmount
  );

  const amountPaid = safeNumber(invoice.amountPaid);
  const balanceDue = safeNumber(invoice.balanceDue, totalAmount - amountPaid);

  const invoiceDate =
    optionalString(invoice.invoiceDate) ??
    optionalString(invoice.issuedDate) ??
    optionalString(invoice.createdDate) ??
    timestamp;

  return {
    id: safeString(invoice.id, createId("INV")),

    invoiceNumber: safeString(invoice.invoiceNumber, generateInvoiceNumber()),

    repairOrderId: optionalString(invoice.repairOrderId),
    repairOrderNumber: optionalString(invoice.repairOrderNumber),
    repairOrderRO: optionalString(invoice.repairOrderRO),

    scheduleEventId: optionalString(invoice.scheduleEventId),
    scheduleEventTitle: optionalString(invoice.scheduleEventTitle),

    customerId: safeString(invoice.customerId),
    customerName: safeString(invoice.customerName, "No Customer"),
    customer: optionalString(invoice.customer),

    customerSnapshot: invoice.customerSnapshot,

    siteId: optionalString(invoice.siteId),
    siteName: optionalString(invoice.siteName),

    equipmentId: optionalString(invoice.equipmentId),
    equipmentName: optionalString(invoice.equipmentName),
    equipmentDescription: optionalString(invoice.equipmentDescription),

    complaint: optionalString(invoice.complaint),
    customerConcern: optionalString(invoice.customerConcern),
    workPerformed: optionalString(invoice.workPerformed),
    recommendations: optionalString(invoice.recommendations),

    subtotalLabor,
    subtotalParts,
    subtotalOther,

    subtotal,

    taxRate,
    tax: taxAmount,
    taxAmount,

    totalAmount,
    total: totalAmount,

    amountPaid,
    balanceDue,

    status: normalizeInvoiceStatus(invoice.status),

    invoiceDate,
    issuedDate: optionalString(invoice.issuedDate) ?? invoiceDate,
    dueDate: optionalString(invoice.dueDate),
    paidDate: optionalString(invoice.paidDate),

    lineItems,

    notes: optionalString(invoice.notes),

    createdDate: safeString(invoice.createdDate, timestamp),
    updatedDate: optionalString(invoice.updatedDate),
  };
}

function readInvoicesStorage(): Invoice[] {
  if (typeof window === "undefined") {
    return [];
  }

  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(data);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.map((invoice) =>
      normalizeInvoice(invoice as InvoiceInput)
    );
  } catch (error) {
    console.error("Failed to parse invoices.", error);

    return [];
  }
}

function writeInvoicesStorage(invoices: Invoice[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  window.dispatchEvent(new Event("t1eq-invoices-changed"));
}

export function getInvoices(): Invoice[] {
  return readInvoicesStorage();
}

export function saveInvoices(invoices: Invoice[]): Invoice[] {
  const normalizedInvoices = invoices.map((invoice) =>
    normalizeInvoice(invoice)
  );

  writeInvoicesStorage(normalizedInvoices);

  return normalizedInvoices;
}

export function generateInvoiceNumber(): string {
  const invoices = readInvoicesStorage();
  const nextNumber = invoices.length + 1;

  return `INV-${nextNumber.toString().padStart(5, "0")}`;
}

export function createInvoice(invoiceInput: InvoiceInput = {}): Invoice {
  const invoices = getInvoices();
  const timestamp = createTimestamp();

  const newInvoice = normalizeInvoice({
    ...invoiceInput,

    id: invoiceInput.id ?? createId("INV"),

    invoiceNumber:
      invoiceInput.invoiceNumber ?? generateInvoiceNumber(),

    status: invoiceInput.status ?? "Draft",

    invoiceDate: invoiceInput.invoiceDate ?? timestamp,
    issuedDate: invoiceInput.issuedDate ?? timestamp,

    createdDate: invoiceInput.createdDate ?? timestamp,
    updatedDate: timestamp,
  });

  saveInvoices([newInvoice, ...invoices]);

  return newInvoice;
}

export function updateInvoice(
  idOrInvoice: string | InvoiceInput,
  updates?: InvoiceInput
): Invoice | null {
  const invoices = getInvoices();

  const id =
    typeof idOrInvoice === "string"
      ? idOrInvoice
      : safeString(idOrInvoice.id);

  const existingInvoice = invoices.find((invoice) => invoice.id === id);

  if (!existingInvoice) {
    return null;
  }

  const updatePayload =
    typeof idOrInvoice === "string" ? updates ?? {} : idOrInvoice;

  const updatedInvoice = normalizeInvoice({
    ...existingInvoice,
    ...updatePayload,
    id: existingInvoice.id,
    invoiceNumber: existingInvoice.invoiceNumber,
    createdDate: existingInvoice.createdDate,
    updatedDate: createTimestamp(),
  });

  saveInvoices(
    invoices.map((invoice) =>
      invoice.id === id ? updatedInvoice : invoice
    )
  );

  return updatedInvoice;
}

export function deleteInvoice(invoiceId: string): void {
  saveInvoices(
    getInvoices().filter((invoice) => invoice.id !== invoiceId)
  );
}

export function getInvoiceById(invoiceId: string): Invoice | undefined {
  return getInvoices().find((invoice) => invoice.id === invoiceId);
}

export function getInvoiceByNumber(
  invoiceNumber: string
): Invoice | undefined {
  return getInvoices().find(
    (invoice) => invoice.invoiceNumber === invoiceNumber
  );
}

export function getInvoicesByCustomerId(customerId: string): Invoice[] {
  return getInvoices().filter(
    (invoice) => invoice.customerId === customerId
  );
}

export function getInvoicesByRepairOrderId(
  repairOrderId: string
): Invoice[] {
  return getInvoices().filter(
    (invoice) => invoice.repairOrderId === repairOrderId
  );
}

export function getInvoicesByScheduleEventId(
  scheduleEventId: string
): Invoice[] {
  return getInvoices().filter(
    (invoice) => invoice.scheduleEventId === scheduleEventId
  );
}

export function searchInvoices(searchTerm: string): Invoice[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return getInvoices();
  }

  return getInvoices().filter((invoice) => {
    return (
      invoice.invoiceNumber.toLowerCase().includes(normalizedSearch) ||
      invoice.customerName.toLowerCase().includes(normalizedSearch) ||
      (invoice.repairOrderNumber ?? "")
        .toLowerCase()
        .includes(normalizedSearch) ||
      invoice.status.toLowerCase().includes(normalizedSearch)
    );
  });
}