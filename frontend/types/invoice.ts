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

  notes?: string;
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

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};