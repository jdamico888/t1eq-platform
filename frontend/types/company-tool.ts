export type CompanyToolStatus =
  | "Available"
  | "Assigned"
  | "In Repair"
  | "Lost"
  | "Retired";

export type CompanyToolLocationType = "Warehouse" | "Truck";

export type CompanyTool = {
  id: string;

  assetNumber: string;
  toolName: string;
  description?: string;

  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;

  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  purchaseOrderLineId?: string;

  cost?: number;
  purchaseDate?: string;

  status: CompanyToolStatus;

  locationType: CompanyToolLocationType;
  locationName?: string;
  binLocation?: string;

  assignedToUserId?: string;
  assignedToName?: string;
  assignedDate?: string;

  receiptImageUrl?: string;
  toolImageUrls?: string[];

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};