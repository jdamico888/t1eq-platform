import type { Inspection } from "../types/inspection";

export const inspections: Inspection[] = [
  {
    id: "INSP-001",

    inspectionNumber: "INSP-001",

    customerId: "CUST-001",
    customerName: "Pacific Tire Center",

    equipmentId: "EQ-1001",
    equipmentName: "Hoffman EEWB770",

    inspectorName: "Joe D'Amico",

    inspectionDate: "2026-05-01",
    nextInspectionDate: "2027-05-01",

    status: "Passed",

    findings: "No structural concerns detected.",

    notes: "Annual inspection completed.",

    createdDate: "2026-05-01T00:00:00.000Z",
  },
];