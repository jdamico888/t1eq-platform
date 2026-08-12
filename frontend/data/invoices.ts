import type { Invoice } from "../types/invoice";

export const invoices: Invoice[] = [
  {
    id: "INV-1001",

    invoiceNumber: "INV-1001",

    repairOrderId: "RO-1001",
    repairOrderNumber: "RO-1001",

    customerId: "CUST-001",
    customerName: "Pacific Tire Center",

    subtotal: 495,
    taxAmount: 23.32,
    totalAmount: 518.32,

    status: "Open",

    issuedDate: "2026-05-20",

    lineItems: [
      {
        id: "INV-1001-LINE-001",
        description: "Labor and parts",
        quantity: 1,
        unitPrice: 495,
        total: 495,
      },
    ],

    createdDate: "2026-05-20T00:00:00.000Z",
  },
];