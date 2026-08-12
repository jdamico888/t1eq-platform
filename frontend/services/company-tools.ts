import type {
  CompanyTool,
  CompanyToolStatus,
} from "@/types/company-tool";

const STORAGE_KEY = "t1eq-company-tools";

const createId = () => {
  return `TOOL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createTimestamp = () => {
  return new Date().toISOString();
};

export type CompanyToolInput = Partial<
  Omit<CompanyTool, "id" | "createdDate" | "updatedDate">
>;

export function getCompanyTools(): CompanyTool[] {
  if (typeof window === "undefined") {
    return [];
  }

  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data) as CompanyTool[];
  } catch (error) {
    console.error("Failed to parse company tools.", error);

    return [];
  }
}

export function saveCompanyTools(companyTools: CompanyTool[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(companyTools));
}

export function generateCompanyToolAssetNumber(): string {
  const companyTools = getCompanyTools();
  const nextNumber = companyTools.length + 1;

  return `T1EQ-TOOL-${nextNumber.toString().padStart(5, "0")}`;
}

export function createCompanyTool(input: CompanyToolInput): CompanyTool {
  const existingCompanyTools = getCompanyTools();
  const timestamp = createTimestamp();

  const companyTool: CompanyTool = {
    id: createId(),

    assetNumber: input.assetNumber ?? generateCompanyToolAssetNumber(),

    toolName: input.toolName ?? "New Company Tool",
    description: input.description ?? "",

    manufacturer: input.manufacturer ?? "",
    modelNumber: input.modelNumber ?? "",
    serialNumber: input.serialNumber ?? "",

    purchaseOrderId: input.purchaseOrderId,
    purchaseOrderNumber: input.purchaseOrderNumber,
    purchaseOrderLineId: input.purchaseOrderLineId,

    cost: input.cost ?? 0,
    purchaseDate: input.purchaseDate,

    status: input.status ?? "Available",

    locationType: input.locationType ?? "Warehouse",
    locationName: input.locationName ?? "Warehouse",
    binLocation: input.binLocation ?? "",

    assignedToUserId: input.assignedToUserId,
    assignedToName: input.assignedToName,
    assignedDate: input.assignedDate,

    receiptImageUrl: input.receiptImageUrl,
    toolImageUrls: input.toolImageUrls ?? [],

    notes: input.notes ?? "",

    createdDate: timestamp,
    updatedDate: timestamp,
  };

  saveCompanyTools([companyTool, ...existingCompanyTools]);

  return companyTool;
}

export function updateCompanyTool(
  companyToolId: string,
  updates: Partial<CompanyTool>
): CompanyTool | null {
  const companyTools = getCompanyTools();

  const existingCompanyTool = companyTools.find(
    (companyTool) => companyTool.id === companyToolId
  );

  if (!existingCompanyTool) {
    return null;
  }

  const updatedCompanyTool: CompanyTool = {
    ...existingCompanyTool,
    ...updates,
    updatedDate: createTimestamp(),
  };

  saveCompanyTools(
    companyTools.map((companyTool) =>
      companyTool.id === companyToolId ? updatedCompanyTool : companyTool
    )
  );

  return updatedCompanyTool;
}

export function deleteCompanyTool(companyToolId: string): void {
  const companyTools = getCompanyTools();

  saveCompanyTools(
    companyTools.filter((companyTool) => companyTool.id !== companyToolId)
  );
}

export function getCompanyToolById(
  companyToolId: string
): CompanyTool | undefined {
  return getCompanyTools().find(
    (companyTool) => companyTool.id === companyToolId
  );
}

export function getCompanyToolsByStatus(
  status: CompanyToolStatus
): CompanyTool[] {
  return getCompanyTools().filter((companyTool) => companyTool.status === status);
}

export function searchCompanyTools(searchTerm: string): CompanyTool[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return getCompanyTools();
  }

  return getCompanyTools().filter((companyTool) => {
    return (
      companyTool.assetNumber.toLowerCase().includes(normalizedSearch) ||
      companyTool.toolName.toLowerCase().includes(normalizedSearch) ||
      (companyTool.description ?? "").toLowerCase().includes(normalizedSearch) ||
      (companyTool.manufacturer ?? "").toLowerCase().includes(normalizedSearch) ||
      (companyTool.modelNumber ?? "").toLowerCase().includes(normalizedSearch) ||
      (companyTool.serialNumber ?? "").toLowerCase().includes(normalizedSearch) ||
      (companyTool.assignedToName ?? "").toLowerCase().includes(normalizedSearch) ||
      (companyTool.locationName ?? "").toLowerCase().includes(normalizedSearch) ||
      (companyTool.binLocation ?? "").toLowerCase().includes(normalizedSearch)
    );
  });
}