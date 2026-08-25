export type InvoiceStatus =
  | "Draft"
  | "Open"
  | "Issued"
  | "Paid"
  | "Partial"
  | "Overdue"
  | "Cancelled"
  | "Void";

export type InvoiceLineItemType =
  | "Labor"
  | "Parts"
  | "Travel"
  | "Misc"
  | "Inspection"
  | "Repair"
  | "Other";

export type InvoiceLineItemSourceType =
  | "Repair Order"
  | "Action Item"
  | "Labor Entry"
  | "Part Entry"
  | "Generated Labor"
  | "Generated Parts"
  | "Generated Travel"
  | "Generated Misc"
  | "Manual";

export type InvoiceLineItem = {
  id: string;

  type: InvoiceLineItemType;
  description: string;

  quantity: number;

  unitPrice: number;
  rate?: number;

  total: number;

  repairOrderId?: string;
  repairOrderNumber?: string;

  actionItemId?: string;

  sourceId?: string;
  sourceType?: InvoiceLineItemSourceType;

  /**
   * The part this line bills, when it came from stock. Carried through from
   * the repair order so a manager's price decision made on the invoice can
   * reach the inventory record, the same way it does from an RO line.
   */
  inventoryItemId?: string;
  partNumber?: string;

  notes?: string;
};

/**
 * One recorded change to an invoice that had already left Draft.
 *
 * Once an invoice has been saved or sent to the customer, it is a document
 * someone else is holding. Changing it silently after that is what makes a
 * record of account indefensible, so every later edit is kept as an
 * amendment: what moved, who moved it, when, and what the invoice's status
 * was at the time.
 */
export type InvoiceAmendment = {
  id: string;

  changedDate: string;

  changedByTechnicianId?: string;
  changedByName: string;

  /** The invoice's status when the change was made. */
  statusAtChange: InvoiceStatus;

  /** Human-readable field name, e.g. "Unit Price" or "Quantity". */
  field: string;

  /** Which line moved. Absent for an invoice-level field. */
  lineItemId?: string;
  lineDescription?: string;

  previousValue: string;
  newValue: string;

  reason?: string;
};

export type InvoiceCustomerSnapshot = {
  customerId?: string;
  customerName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  billingAddress?: string;
  serviceAddress?: string;
};

export type Invoice = {
  id: string;

  invoiceNumber: string;

  repairOrderId?: string;
  repairOrderNumber?: string;
  repairOrderRO?: string;

  /**
   * Set when this invoice was generated directly from an appointment
   * (ScheduleEvent) rather than from a Repair Order. Appointments must pass
   * the invoicing gate in services/schedule-event-invoicing.ts before an
   * invoice can be generated from them.
   */
  scheduleEventId?: string;
  scheduleEventTitle?: string;

  customerId: string;
  customerName: string;
  customer?: string;
  customerSnapshot?: InvoiceCustomerSnapshot;

  siteId?: string;
  siteName?: string;

  equipmentId?: string;
  equipmentName?: string;
  equipmentDescription?: string;

  complaint?: string;
  customerConcern?: string;
  workPerformed?: string;
  recommendations?: string;

  subtotalLabor: number;
  subtotalParts: number;
  subtotalOther: number;

  subtotal: number;

  taxRate: number;
  tax: number;
  taxAmount: number;

  totalAmount: number;
  total?: number;

  amountPaid: number;
  balanceDue: number;

  status: InvoiceStatus;

  invoiceDate?: string;
  issuedDate?: string;
  dueDate?: string;
  paidDate?: string;

  lineItems: InvoiceLineItem[];

  /**
   * Every change made after the invoice left Draft, oldest first. Empty or
   * absent on an invoice that has only ever been edited as a draft.
   */
  amendments?: InvoiceAmendment[];

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};