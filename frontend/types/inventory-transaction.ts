export type InventoryTransactionType =
  | "Adjustment"
  | "Repair Usage"
  | "Install Usage"
  | "Inspection Usage"
  | "Purchase Receipt"
  | "Transfer"
  | "Return"
  | "Receipt"
  | "Consumption"
  | "Restoration"
  | "Reservation"
  | "Release";

export type InventoryTransactionSource =
  | "Repair Order"
  | "Purchase Order"
  | "Manual Adjustment"
  | "Inventory Count"
  | "Truck Stock"
  | "System";

export type InventoryTransaction = {
  id: string;

  inventoryItemId: string;

  partNumber?: string;
  description?: string;

  type: InventoryTransactionType;
  transactionType?: InventoryTransactionType;

  source?: InventoryTransactionSource;

  quantity: number;
  quantityChange?: number;

  previousQuantity: number;
  quantityBefore?: number;

  newQuantity: number;
  quantityAfter?: number;

  referenceId?: string;
  referenceNumber?: string;

  repairOrderId?: string;
  repairOrderNumber?: string;

  actionItemId?: string;

  notes?: string;

  createdDate: string;

  createdBy?: string;
  createdById?: string;
  createdByName?: string;
};