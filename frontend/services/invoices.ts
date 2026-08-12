type StoredInvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  rate?: number;
  unitPrice?: number;
  total: number;
  repairOrderId?: string;
  repairOrderNumber?: string;
  actionItemId?: string;
  notes?: string;
  [key: string]: any;
};

type StoredInvoice = {
  id: string;
  invoiceNumber: string;

  customerId: string;
  customerName: string;

  repairOrderId?: string;
  repairOrderNumber?: string;

  status: string;

  invoiceDate?: string;
  dueDate?: string;

  lineItems: StoredInvoiceLineItem[];

  subtotal: number;
  tax: number;
  taxAmount: number;
  total: number;
  totalAmount: number;

  amountPaid: number;
  balanceDue: number;

  notes?: string;

  createdDate: string;
  updatedDate?: string;

  [key: string]: any;
};

export type Invoice = StoredInvoice;
export type InvoiceLineItem = StoredInvoiceLineItem;
export type InvoiceInput = Record<string, any>;

const STORAGE_KEY = "t1eq-invoices";

const createId = () => {
  return `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createTimestamp = () => {
  return new Date().toISOString();
};

export function calculateInvoiceTotals(
  lineItems: StoredInvoiceLineItem[] = [],
  taxRate = 0
) {
  const subtotal = lineItems.reduce((total, lineItem) => {
    return total + Number(lineItem.total || 0);
  }, 0);

  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return {
    subtotal,
    tax: taxAmount,
    taxAmount,
    total,
    totalAmount: total,
  };
}

function normalizeInvoice(invoice: Record<string, any>): StoredInvoice {
  const timestamp = createTimestamp();

  const lineItems: StoredInvoiceLineItem[] = Array.isArray(invoice.lineItems)
    ? invoice.lineItems
    : [];

  const totals = calculateInvoiceTotals(lineItems, 0);

  const total = Number(
    invoice.totalAmount ?? invoice.total ?? totals.total ?? 0
  );

  const amountPaid = Number(invoice.amountPaid ?? 0);

  return {
    ...invoice,

    id: String(invoice.id ?? createId()),

    invoiceNumber: String(
      invoice.invoiceNumber ?? generateInvoiceNumber()
    ),

    customerId: String(invoice.customerId ?? ""),
    customerName: String(invoice.customerName ?? "No Customer"),

    repairOrderId: invoice.repairOrderId
      ? String(invoice.repairOrderId)
      : undefined,

    repairOrderNumber: invoice.repairOrderNumber
      ? String(invoice.repairOrderNumber)
      : undefined,

    status: String(invoice.status ?? "Draft"),

    invoiceDate: invoice.invoiceDate
      ? String(invoice.invoiceDate)
      : String(invoice.createdDate ?? timestamp),

    dueDate: invoice.dueDate ? String(invoice.dueDate) : undefined,

    lineItems,

    subtotal: Number(invoice.subtotal ?? totals.subtotal ?? 0),
    tax: Number(invoice.tax ?? totals.tax ?? 0),
    taxAmount: Number(invoice.taxAmount ?? totals.taxAmount ?? 0),
    total,
    totalAmount: total,

    amountPaid,
    balanceDue: Number(invoice.balanceDue ?? total - amountPaid),

    notes: invoice.notes ? String(invoice.notes) : undefined,

    createdDate: String(invoice.createdDate ?? timestamp),
    updatedDate: invoice.updatedDate ? String(invoice.updatedDate) : undefined,
  };
}

export function getInvoices(): any[] {
  if (typeof window === "undefined") {
    return [];
  }

  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    return (JSON.parse(data) as Record<string, any>[]).map(normalizeInvoice);
  } catch (error) {
    console.error("Failed to parse invoices.", error);

    return [];
  }
}

export function saveInvoices(invoices: any[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

export function generateInvoiceNumber(): string {
  const invoices = getInvoices();

  const nextNumber = invoices.length + 1;

  return `INV-${nextNumber.toString().padStart(5, "0")}`;
}

export function createInvoice(invoiceInput: InvoiceInput = {}): any {
  const invoices = getInvoices();

  const timestamp = createTimestamp();

  const newInvoice = normalizeInvoice({
    ...invoiceInput,

    id: createId(),

    invoiceNumber: invoiceInput.invoiceNumber ?? generateInvoiceNumber(),

    status: invoiceInput.status ?? "Draft",

    invoiceDate: invoiceInput.invoiceDate ?? timestamp,

    createdDate: timestamp,
    updatedDate: timestamp,
  });

  saveInvoices([newInvoice, ...invoices]);

  return newInvoice;
}

export function updateInvoice(
  idOrInvoice: string | Record<string, any>,
  updates?: Record<string, any>
): any | null {
  const invoices = getInvoices();

  const id =
    typeof idOrInvoice === "string"
      ? idOrInvoice
      : String(idOrInvoice.id);

  const existingInvoice = invoices.find((invoice) => invoice.id === id);

  if (!existingInvoice) {
    return null;
  }

  const updatePayload =
    typeof idOrInvoice === "string" ? updates ?? {} : idOrInvoice;

  const updatedInvoice = normalizeInvoice({
    ...existingInvoice,
    ...updatePayload,
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

export function getInvoiceById(invoiceId: string): any | undefined {
  return getInvoices().find((invoice) => invoice.id === invoiceId);
}

export function getInvoiceByNumber(
  invoiceNumber: string
): any | undefined {
  return getInvoices().find(
    (invoice) => invoice.invoiceNumber === invoiceNumber
  );
}

export function getInvoicesByCustomerId(customerId: string): any[] {
  return getInvoices().filter(
    (invoice) => invoice.customerId === customerId
  );
}

export function getInvoicesByRepairOrderId(
  repairOrderId: string
): any[] {
  return getInvoices().filter(
    (invoice) => invoice.repairOrderId === repairOrderId
  );
}

export function searchInvoices(searchTerm: string): any[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return getInvoices();
  }

  return getInvoices().filter((invoice) => {
    return (
      String(invoice.invoiceNumber ?? "")
        .toLowerCase()
        .includes(normalizedSearch) ||
      String(invoice.customerName ?? "")
        .toLowerCase()
        .includes(normalizedSearch) ||
      String(invoice.repairOrderNumber ?? "")
        .toLowerCase()
        .includes(normalizedSearch) ||
      String(invoice.status ?? "")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  });
}