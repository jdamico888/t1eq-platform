import type {
  InventoryDiscrepancy,
  InventoryDiscrepancyStatus,
} from "@/types/inventory-discrepancy";

const STORAGE_KEY = "t1eq-inventory-discrepancies";

const createId = () => {
  return `DISC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createTimestamp = () => {
  return new Date().toISOString();
};

export function getInventoryDiscrepancies(): InventoryDiscrepancy[] {
  if (typeof window === "undefined") {
    return [];
  }

  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data) as InventoryDiscrepancy[];
  } catch (error) {
    console.error("Failed to parse inventory discrepancies.", error);

    return [];
  }
}

export function saveInventoryDiscrepancies(
  discrepancies: InventoryDiscrepancy[]
): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(discrepancies));
}

export function createInventoryDiscrepancy(
  discrepancy: Omit<InventoryDiscrepancy, "id" | "createdDate" | "status">
): InventoryDiscrepancy {
  const existingDiscrepancies = getInventoryDiscrepancies();

  const newDiscrepancy: InventoryDiscrepancy = {
    ...discrepancy,
    id: createId(),
    status: "Open",
    createdDate: createTimestamp(),
  };

  saveInventoryDiscrepancies([newDiscrepancy, ...existingDiscrepancies]);

  return newDiscrepancy;
}

export function updateInventoryDiscrepancy(
  discrepancyId: string,
  updates: Partial<InventoryDiscrepancy>
): InventoryDiscrepancy | null {
  const discrepancies = getInventoryDiscrepancies();

  const existingDiscrepancy = discrepancies.find(
    (discrepancy) => discrepancy.id === discrepancyId
  );

  if (!existingDiscrepancy) {
    return null;
  }

  const updatedDiscrepancy: InventoryDiscrepancy = {
    ...existingDiscrepancy,
    ...updates,
    updatedDate: createTimestamp(),
  };

  saveInventoryDiscrepancies(
    discrepancies.map((discrepancy) =>
      discrepancy.id === discrepancyId ? updatedDiscrepancy : discrepancy
    )
  );

  return updatedDiscrepancy;
}

export function resolveInventoryDiscrepancy(
  discrepancyId: string,
  input: {
    resolvedBy?: string;
    resolutionNotes?: string;
    status?: InventoryDiscrepancyStatus;
  }
): InventoryDiscrepancy | null {
  return updateInventoryDiscrepancy(discrepancyId, {
    status: input.status ?? "Resolved",
    resolvedBy: input.resolvedBy,
    resolutionNotes: input.resolutionNotes,
    resolvedDate: createTimestamp(),
  });
}

export function getOpenInventoryDiscrepancies(): InventoryDiscrepancy[] {
  return getInventoryDiscrepancies().filter(
    (discrepancy) =>
      discrepancy.status === "Open" || discrepancy.status === "Under Review"
  );
}

export function getInventoryDiscrepanciesByPartNumber(
  partNumber: string
): InventoryDiscrepancy[] {
  const normalizedPartNumber = partNumber.trim().toLowerCase();

  return getInventoryDiscrepancies().filter(
    (discrepancy) =>
      discrepancy.partNumber.trim().toLowerCase() === normalizedPartNumber
  );
}