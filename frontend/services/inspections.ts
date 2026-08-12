import type { Inspection, InspectionStatus } from "@/types/inspection";

import {
  createId,
  createTimestamp,
  readStorageArray,
  writeStorageArray,
} from "@/lib/storage";

const STORAGE_KEY = "tier1_inspections";

export type { Inspection } from "@/types/inspection";

export type InspectionInput = {
  id?: string;

  inspectionNumber?: string;

  customerId?: string;
  customerName?: string;

  siteId?: string;
  siteName?: string;

  equipmentId: string;
  equipmentName?: string;

  inspectorId?: string;
  inspectorName?: string;
  inspector?: string;

  inspectionDate: string;
  inspectionType?: string;
  inspectionDue?: string;
  nextInspectionDate?: string;

  status: InspectionStatus;

  findings?: string;
  recommendations?: string;
  correctiveActions?: string;

  qrCodeUrl?: string;
  reportUrl?: string;
  labelUrl?: string;

  notes?: string;
};

export function getInspections(): Inspection[] {
  return readStorageArray<Inspection>(STORAGE_KEY);
}

export function saveInspections(inspections: Inspection[]): void {
  writeStorageArray<Inspection>(STORAGE_KEY, inspections);
}

export function generateInspectionNumber(): string {
  const inspections = getInspections();
  const nextNumber = inspections.length + 1;

  return `INSP-${nextNumber.toString().padStart(5, "0")}`;
}

const normalizeInspectionInput = (
  inspection: InspectionInput
): Omit<Inspection, "createdDate" | "updatedDate"> => {
  return {
    id: inspection.id ?? createId(),

    inspectionNumber:
      inspection.inspectionNumber ?? generateInspectionNumber(),

    customerId: inspection.customerId ?? "",
    customerName: inspection.customerName ?? "Unknown Customer",

    siteId: inspection.siteId,
    siteName: inspection.siteName,

    equipmentId: inspection.equipmentId,
    equipmentName: inspection.equipmentName ?? "Unknown Equipment",

    inspectorId: inspection.inspectorId,
    inspectorName:
      inspection.inspectorName ?? inspection.inspector,
    inspector: inspection.inspector ?? inspection.inspectorName,

    inspectionDate: inspection.inspectionDate,
    inspectionType: inspection.inspectionType,
    inspectionDue: inspection.inspectionDue,
    nextInspectionDate:
      inspection.nextInspectionDate ?? inspection.inspectionDue,

    status: inspection.status,

    findings: inspection.findings,
    recommendations: inspection.recommendations,
    correctiveActions: inspection.correctiveActions,

    qrCodeUrl: inspection.qrCodeUrl,
    reportUrl: inspection.reportUrl,
    labelUrl: inspection.labelUrl,

    notes: inspection.notes,
  };
};

export function createInspection(
  inspection: InspectionInput
): Inspection {
  const existingInspections = getInspections();
  const timestamp = createTimestamp();

  const normalizedInspection = normalizeInspectionInput(inspection);

  const newInspection: Inspection = {
    ...normalizedInspection,
    createdDate: timestamp,
    updatedDate: timestamp,
  };

  saveInspections([...existingInspections, newInspection]);

  return newInspection;
}

export function updateInspection(
  idOrInspection: string | Inspection,
  updates?: Partial<InspectionInput>
): Inspection | null {
  const inspections = getInspections();

  const id =
    typeof idOrInspection === "string"
      ? idOrInspection
      : idOrInspection.id;

  const existingInspection = inspections.find(
    (inspection) => inspection.id === id
  );

  if (!existingInspection) {
    return null;
  }

  const updatePayload =
    typeof idOrInspection === "string"
      ? updates ?? {}
      : idOrInspection;

  const updatedInspection: Inspection = {
    ...existingInspection,
    ...updatePayload,
    updatedDate: createTimestamp(),
  };

  saveInspections(
    inspections.map((inspection) =>
      inspection.id === id ? updatedInspection : inspection
    )
  );

  return updatedInspection;
}

export function deleteInspection(id: string): void {
  const inspections = getInspections();

  saveInspections(
    inspections.filter((inspection) => inspection.id !== id)
  );
}

export function getInspectionById(
  id: string
): Inspection | undefined {
  return getInspections().find(
    (inspection) => inspection.id === id
  );
}

export function getInspectionByNumber(
  inspectionNumber: string
): Inspection | undefined {
  return getInspections().find(
    (inspection) =>
      inspection.inspectionNumber === inspectionNumber
  );
}

export function getInspectionsByCustomerId(
  customerId: string
): Inspection[] {
  return getInspections().filter(
    (inspection) => inspection.customerId === customerId
  );
}

export function getInspectionsByEquipmentId(
  equipmentId: string
): Inspection[] {
  return getInspections().filter(
    (inspection) => inspection.equipmentId === equipmentId
  );
}

export function searchInspections(
  searchTerm: string
): Inspection[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return getInspections();
  }

  return getInspections().filter((inspection) => {
    return (
      inspection.inspectionNumber
        .toLowerCase()
        .includes(normalizedSearch) ||
      inspection.customerName
        .toLowerCase()
        .includes(normalizedSearch) ||
      Boolean(
        inspection.siteName
          ?.toLowerCase()
          .includes(normalizedSearch)
      ) ||
      inspection.equipmentName
        .toLowerCase()
        .includes(normalizedSearch) ||
      Boolean(
        inspection.inspectorName
          ?.toLowerCase()
          .includes(normalizedSearch)
      ) ||
      Boolean(
        inspection.inspector
          ?.toLowerCase()
          .includes(normalizedSearch)
      ) ||
      inspection.status.toLowerCase().includes(normalizedSearch)
    );
  });
}