import type { Invoice } from "../types/invoice";

export const invoices: Invoice[] = [
  {
    id: "INV-1001",

    invoiceNumber: "INV-1001",

    repairOrderId: "RO-1001",
    repairOrderNumber: "RO-1001",
    repairOrderRO: "RO-1001",

    customerId: "CUST-001",
    customerName: "Pacific Tire Center",
    customer: "Pacific Tire Center",

    subtotalLabor: 495,
    subtotalParts: 0,
    subtotalOther: 0,

    subtotal: 495,

    taxRate: 0.04712,
    tax: 23.32,
    taxAmount: 23.32,

    totalAmount: 518.32,
    total: 518.32,

    amountPaid: 0,
    balanceDue: 518.32,

    status: "Open",

    invoiceDate: "2026-05-20",
    issuedDate: "2026-05-20",

    lineItems: [
      {
        id: "INV-1001-LINE-001",

        type: "Labor",
        description: "Labor and parts",

        quantity: 1,

        unitPrice: 495,
        rate: 495,

        total: 495,

        repairOrderId: "RO-1001",
        repairOrderNumber: "RO-1001",

        sourceType: "Manual",
      },
    ],

    createdDate: "2026-05-20T00:00:00.000Z",
    updatedDate: "2026-05-20T00:00:00.000Z",
  },
];