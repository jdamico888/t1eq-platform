export type PurchaseOrderStatus =
  | "Draft"
  | "Open"
  | "Ordered"
  | "Partially Received"
  | "Received"
  | "Cancelled";

export type PurchaseOrderReceiveLocationType =
  | "Warehouse"
  | "Truck"
  | "Custom";

export type PurchaseOrderLineClass =
  | "Inventory Stock"
  | "Company Tools"
  | "Repair Order Direct Charge";

export type PurchaseOrderLine = {
  id: string;

  lineClass: PurchaseOrderLineClass;

  inventoryItemId?: string;

  partNumber: string;
  description: string;

  quantity: number;

  cost: number;
  total: number;

  receiveLocationId?: string;
  receiveLocationName?: string;
  receiveLocationType?: PurchaseOrderReceiveLocationType;

  binLocation?: string;

  repairOrderId?: string;
  repairOrderNumber?: string;
  repairOrderLineId?: string;
  repairOrderLineLabel?: string;
};

export type PurchaseOrderLineItem = {
  id: string;

  lineClass?: PurchaseOrderLineClass;

  inventoryItemId?: string;

  partNumber?: string;
  description: string;

  quantity: number;

  unitCost: number;
  total: number;

  receiveLocationId?: string;
  receiveLocationName?: string;
  receiveLocationType?: PurchaseOrderReceiveLocationType;

  binLocation?: string;

  repairOrderId?: string;
  repairOrderNumber?: string;
  repairOrderLineId?: string;
  repairOrderLineLabel?: string;
};

export type PurchaseOrder = {
  id: string;

  poNumber?: string;
  purchaseOrderNumber?: string;

  supplier?: string;
  supplierId?: string;
  supplierName?: string;

  status: PurchaseOrderStatus;

  orderDate?: string;
  orderedDate?: string;

  expectedDate?: string;
  receivedDate?: string;

  subtotal: number;

  tax?: number;
  taxAmount?: number;

  shipping?: number;

  total?: number;
  totalAmount?: number;

  notes?: string;

  lines?: PurchaseOrderLine[];
  lineItems?: PurchaseOrderLineItem[];

  createdBy?: string;

  createdDate: string;
  updatedDate?: string;
};