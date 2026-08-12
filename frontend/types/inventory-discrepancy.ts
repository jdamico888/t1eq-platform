export type InventoryDiscrepancyStatus =
  | "Open"
  | "Under Review"
  | "Resolved"
  | "Dismissed";

export type InventoryDiscrepancySource =
  | "Purchase Order Receiving"
  | "Inventory Count"
  | "Truck Stock"
  | "Manual Adjustment"
  | "System";

export type InventoryDiscrepancy = {
  id: string;

  source: InventoryDiscrepancySource;

  inventoryItemId?: string;

  partNumber: string;
  description?: string;

  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  purchaseOrderLineId?: string;

  expectedQuantityOnHand: number;
  liveInventoryCount: number;
  discrepancyQuantity: number;

  locationId?: string;
  locationName?: string;
  binLocation?: string;

  status: InventoryDiscrepancyStatus;

  notes?: string;

  createdDate: string;
  updatedDate?: string;

  resolvedDate?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
};