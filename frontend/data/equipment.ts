import type { Equipment } from "../types/equipment";

export const equipment: Equipment[] = [
  {
    id: "EQ-1001",

    customerId: "CUST-001",
    customerName: "Pacific Tire Center",

    manufacturer: "Hoffman",
    model: "EEWB770",
    serialNumber: "HF770-4421",

    category: "Wheel Balancer",

    status: "Active",

    notes: "Primary front shop balancer",

    createdDate: "2026-01-01T00:00:00.000Z",
  },

  {
    id: "EQ-1002",

    customerId: "CUST-001",
    customerName: "Pacific Tire Center",

    manufacturer: "John Bean",
    model: "T7800",
    serialNumber: "JB7800-9912",

    category: "Tire Changer",

    status: "Active",

    createdDate: "2026-01-01T00:00:00.000Z",
  },
];