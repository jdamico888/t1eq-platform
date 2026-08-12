import type {
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderLineClass,
  PurchaseOrderLineItem,
  PurchaseOrderReceiveLocationType,
} from "@/types/purchase-order";

import {
  createId,
  createTimestamp,
  readStorageArray,
  writeStorageArray,
} from "@/lib/storage";

const STORAGE_KEY = "tier1_purchase_orders";

export type { PurchaseOrder } from "@/types/purchase-order";

export type PurchaseOrderInput = Partial<
  Omit<PurchaseOrder, "id" | "createdDate" | "updatedDate">
>;

const normalizeNumber = (value: unknown): number => {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
};

const normalizeLineClass = (value: unknown): PurchaseOrderLineClass => {
  if (
    value === "Inventory Stock" ||
    value === "Company Tools" ||
    value === "Repair Order Direct Charge"
  ) {
    return value;
  }

  return "Inventory Stock";
};

const isReceivingLineClass = (lineClass: PurchaseOrderLineClass) => {
  return lineClass === "Inventory Stock" || lineClass === "Company Tools";
};

const normalizeReceiveLocationType = (
  value: unknown
): PurchaseOrderReceiveLocationType => {
  if (value === "Warehouse" || value === "Truck" || value === "Custom") {
    return value;
  }

  return "Warehouse";
};

const normalizeLine = (line: Partial<PurchaseOrderLine>): PurchaseOrderLine => {
  const quantity = normalizeNumber(line.quantity);
  const cost = normalizeNumber(line.cost);
  const lineClass = normalizeLineClass(line.lineClass);

  return {
    id: String(line.id ?? createId()),

    lineClass,

    inventoryItemId: undefined,

    partNumber: line.partNumber ?? "",
    description: line.description ?? "",

    quantity,
    cost,
    total: quantity * cost,

    receiveLocationId: isReceivingLineClass(lineClass)
      ? line.receiveLocationId ?? "warehouse"
      : undefined,

    receiveLocationName: isReceivingLineClass(lineClass)
      ? line.receiveLocationName ?? "Warehouse"
      : undefined,

    receiveLocationType: isReceivingLineClass(lineClass)
      ? normalizeReceiveLocationType(line.receiveLocationType)
      : undefined,

    binLocation: isReceivingLineClass(lineClass)
      ? line.binLocation ?? ""
      : undefined,

    repairOrderId:
      lineClass === "Repair Order Direct Charge"
        ? line.repairOrderId
        : undefined,

    repairOrderNumber:
      lineClass === "Repair Order Direct Charge"
        ? line.repairOrderNumber ?? ""
        : undefined,

    repairOrderLineId:
      lineClass === "Repair Order Direct Charge"
        ? line.repairOrderLineId
        : undefined,

    repairOrderLineLabel:
      lineClass === "Repair Order Direct Charge"
        ? line.repairOrderLineLabel ?? ""
        : undefined,
  };
};

const normalizeLineItem = (
  lineItem: PurchaseOrderLineItem
): PurchaseOrderLine => {
  const quantity = normalizeNumber(lineItem.quantity);
  const cost = normalizeNumber(lineItem.unitCost);
  const lineClass = normalizeLineClass(lineItem.lineClass);

  return normalizeLine({
    id: lineItem.id,
    lineClass,
    inventoryItemId: undefined,
    partNumber: lineItem.partNumber ?? "",
    description: lineItem.description,
    quantity,
    cost,
    total: quantity * cost,
    receiveLocationId: lineItem.receiveLocationId,
    receiveLocationName: lineItem.receiveLocationName,
    receiveLocationType: lineItem.receiveLocationType,
    binLocation: lineItem.binLocation,
    repairOrderId: lineItem.repairOrderId,
    repairOrderNumber: lineItem.repairOrderNumber,
    repairOrderLineId: lineItem.repairOrderLineId,
    repairOrderLineLabel: lineItem.repairOrderLineLabel,
  });
};

const normalizeLineItems = (
  purchaseOrder: Partial<PurchaseOrder>
): PurchaseOrderLine[] => {
  if (Array.isArray(purchaseOrder.lines)) {
    return purchaseOrder.lines.map((line) => normalizeLine(line));
  }

  if (Array.isArray(purchaseOrder.lineItems)) {
    return purchaseOrder.lineItems.map((lineItem) =>
      normalizeLineItem(lineItem)
    );
  }

  return [];
};

const toLineItems = (lines: PurchaseOrderLine[]): PurchaseOrderLineItem[] => {
  return lines.map((line) => {
    const normalizedLine = normalizeLine(line);

    return {
      id: normalizedLine.id,
      lineClass: normalizedLine.lineClass,
      inventoryItemId: undefined,
      partNumber: normalizedLine.partNumber,
      description: normalizedLine.description,
      quantity: normalizedLine.quantity,
      unitCost: normalizedLine.cost,
      total: normalizedLine.total,
      receiveLocationId: normalizedLine.receiveLocationId,
      receiveLocationName: normalizedLine.receiveLocationName,
      receiveLocationType: normalizedLine.receiveLocationType,
      binLocation: normalizedLine.binLocation,
      repairOrderId: normalizedLine.repairOrderId,
      repairOrderNumber: normalizedLine.repairOrderNumber,
      repairOrderLineId: normalizedLine.repairOrderLineId,
      repairOrderLineLabel: normalizedLine.repairOrderLineLabel,
    };
  });
};

export function calculatePurchaseOrderTotals(
  lines: PurchaseOrderLine[] = [],
  taxRate = 0,
  shipping = 0
) {
  const normalizedLines = lines.map((line) => normalizeLine(line));

  const subtotal = normalizedLines.reduce((total, line) => {
    return total + line.total;
  }, 0);

  const tax = subtotal * taxRate;
  const safeShipping = normalizeNumber(shipping);
  const total = subtotal + tax + safeShipping;

  return {
    subtotal,
    tax,
    taxAmount: tax,
    shipping: safeShipping,
    total,
    totalAmount: total,
  };
}

export function getPurchaseOrders(): PurchaseOrder[] {
  return readStorageArray<PurchaseOrder>(STORAGE_KEY).map((purchaseOrder) => {
    const lines = normalizeLineItems(purchaseOrder);

    const totals = calculatePurchaseOrderTotals(
      lines,
      0,
      purchaseOrder.shipping ?? 0
    );

    return {
      ...purchaseOrder,

      poNumber:
        purchaseOrder.poNumber ?? purchaseOrder.purchaseOrderNumber ?? "",

      purchaseOrderNumber:
        purchaseOrder.purchaseOrderNumber ?? purchaseOrder.poNumber ?? "",

      supplier: purchaseOrder.supplier ?? purchaseOrder.supplierName ?? "",

      supplierName:
        purchaseOrder.supplierName ?? purchaseOrder.supplier ?? "",

      supplierId: purchaseOrder.supplierId ?? "",

      lines,
      lineItems: toLineItems(lines),

      subtotal: totals.subtotal,
      tax: totals.tax,
      taxAmount: totals.taxAmount,
      shipping: totals.shipping,
      total: totals.total,
      totalAmount: totals.totalAmount,
    };
  });
}

export function savePurchaseOrders(purchaseOrders: PurchaseOrder[]): void {
  writeStorageArray<PurchaseOrder>(STORAGE_KEY, purchaseOrders);
}

export function generatePurchaseOrderNumber(): string {
  const purchaseOrders = getPurchaseOrders();
  const nextNumber = purchaseOrders.length + 1;

  return `PO-${nextNumber.toString().padStart(5, "0")}`;
}

export function createPurchaseOrder(
  purchaseOrder: PurchaseOrderInput
): PurchaseOrder {
  const existingPurchaseOrders = getPurchaseOrders();
  const timestamp = createTimestamp();

  const generatedNumber =
    purchaseOrder.purchaseOrderNumber ??
    purchaseOrder.poNumber ??
    generatePurchaseOrderNumber();

  const lines = normalizeLineItems(purchaseOrder);

  const totals = calculatePurchaseOrderTotals(
    lines,
    0,
    purchaseOrder.shipping ?? 0
  );

  const newPurchaseOrder: PurchaseOrder = {
    id: createId(),

    poNumber: generatedNumber,
    purchaseOrderNumber: generatedNumber,

    supplier: purchaseOrder.supplier ?? purchaseOrder.supplierName ?? "",
    supplierId: purchaseOrder.supplierId ?? "",
    supplierName: purchaseOrder.supplierName ?? purchaseOrder.supplier ?? "",

    status: purchaseOrder.status ?? "Draft",

    orderDate: purchaseOrder.orderDate ?? purchaseOrder.orderedDate,
    orderedDate: purchaseOrder.orderedDate ?? purchaseOrder.orderDate,

    expectedDate: purchaseOrder.expectedDate,
    receivedDate: purchaseOrder.receivedDate,

    lines,
    lineItems: toLineItems(lines),

    subtotal: totals.subtotal,
    tax: totals.tax,
    taxAmount: totals.taxAmount,
    shipping: totals.shipping,
    total: totals.total,
    totalAmount: totals.totalAmount,

    notes: purchaseOrder.notes,
    createdBy: purchaseOrder.createdBy,

    createdDate: timestamp,
    updatedDate: timestamp,
  };

  savePurchaseOrders([newPurchaseOrder, ...existingPurchaseOrders]);

  return newPurchaseOrder;
}

export function updatePurchaseOrder(
  idOrPurchaseOrder: string | PurchaseOrder,
  updates?: Partial<PurchaseOrderInput>
): PurchaseOrder | null {
  const purchaseOrders = getPurchaseOrders();

  const id =
    typeof idOrPurchaseOrder === "string"
      ? idOrPurchaseOrder
      : idOrPurchaseOrder.id;

  const existingPurchaseOrder = purchaseOrders.find(
    (purchaseOrder) => purchaseOrder.id === id
  );

  if (!existingPurchaseOrder) {
    return null;
  }

  const updatePayload =
    typeof idOrPurchaseOrder === "string" ? updates ?? {} : idOrPurchaseOrder;

  const mergedPurchaseOrder: PurchaseOrder = {
    ...existingPurchaseOrder,
    ...updatePayload,
    updatedDate: createTimestamp(),
  };

  const lines = normalizeLineItems(mergedPurchaseOrder);

  const totals = calculatePurchaseOrderTotals(
    lines,
    0,
    mergedPurchaseOrder.shipping ?? 0
  );

  const updatedPurchaseOrder: PurchaseOrder = {
    ...mergedPurchaseOrder,

    lines,
    lineItems: toLineItems(lines),

    subtotal: totals.subtotal,
    tax: totals.tax,
    taxAmount: totals.taxAmount,
    shipping: totals.shipping,
    total: totals.total,
    totalAmount: totals.totalAmount,
  };

  savePurchaseOrders(
    purchaseOrders.map((purchaseOrder) =>
      purchaseOrder.id === id ? updatedPurchaseOrder : purchaseOrder
    )
  );

  return updatedPurchaseOrder;
}

export function deletePurchaseOrder(id: string): void {
  const purchaseOrders = getPurchaseOrders();

  savePurchaseOrders(
    purchaseOrders.filter((purchaseOrder) => purchaseOrder.id !== id)
  );
}

export function getPurchaseOrderById(id: string): PurchaseOrder | undefined {
  return getPurchaseOrders().find((purchaseOrder) => purchaseOrder.id === id);
}

export function getPurchaseOrderByNumber(
  purchaseOrderNumber: string
): PurchaseOrder | undefined {
  return getPurchaseOrders().find(
    (purchaseOrder) =>
      purchaseOrder.purchaseOrderNumber === purchaseOrderNumber ||
      purchaseOrder.poNumber === purchaseOrderNumber
  );
}

export function getPurchaseOrdersBySupplierId(
  supplierId: string
): PurchaseOrder[] {
  return getPurchaseOrders().filter(
    (purchaseOrder) => purchaseOrder.supplierId === supplierId
  );
}

export function searchPurchaseOrders(searchTerm: string): PurchaseOrder[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return getPurchaseOrders();
  }

  return getPurchaseOrders().filter((purchaseOrder) => {
    return (
      (purchaseOrder.purchaseOrderNumber ?? "")
        .toLowerCase()
        .includes(normalizedSearch) ||
      (purchaseOrder.poNumber ?? "")
        .toLowerCase()
        .includes(normalizedSearch) ||
      (purchaseOrder.supplierName ?? "")
        .toLowerCase()
        .includes(normalizedSearch) ||
      (purchaseOrder.supplier ?? "")
        .toLowerCase()
        .includes(normalizedSearch) ||
      purchaseOrder.status.toLowerCase().includes(normalizedSearch)
    );
  });
}