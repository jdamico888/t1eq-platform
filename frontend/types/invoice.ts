export type InvoiceStatus =
  | "Draft"
  | "Open"
  | "Paid"
  | "Partial"
  | "Overdue"
  | "Cancelled";

export type InvoiceLineItem = {
  id: string;

  description: string;

  quantity: number;

  unitPrice: number;

  total: number;
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

  subtotal: number;
  taxAmount: number;

  totalAmount: number;
  total?: number;

  status: InvoiceStatus;

  issuedDate?: string;
  dueDate?: string;
  paidDate?: string;

  lineItems: InvoiceLineItem[];

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};