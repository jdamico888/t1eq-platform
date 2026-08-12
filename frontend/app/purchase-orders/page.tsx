"use client";

import { useEffect, useMemo, useState } from "react";

import type { InventoryItem } from "../../types/inventory-item";

import type {
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderLineClass,
  PurchaseOrderReceiveLocationType,
} from "../../types/purchase-order";

import {
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrders,
  updatePurchaseOrder,
} from "../../services/purchase-orders";

import {
  getInventoryItems,
  getRecommendedOrderItems,
} from "../../services/inventory";

import { createInventoryDiscrepancy } from "../../services/inventory-discrepancies";
import { createCompanyTool } from "../../services/company-tools";

type StockLocationKind = "Warehouse" | "Truck";

type PurchaseOrderStatusTileFilter = "All" | "Open" | "Received" | null;

type DraftLine = {
  id: string;
  lineClass: PurchaseOrderLineClass;
  partNumber: string;
  description: string;
  quantity: string;
  cost: string;
  receiveLocationType: PurchaseOrderReceiveLocationType;
  receiveLocationId?: string;
  receiveLocationName?: string;
  stockLocationKind: StockLocationKind;
  warehouseRow?: string;
  truckCompartment?: string;
  shelf?: string;
  locationNumber?: string;
  repairOrderId?: string;
  repairOrderNumber?: string;
  repairOrderLineId?: string;
  repairOrderLineLabel?: string;
};

type QuantityProjection = {
  inventoryItem?: InventoryItem;
  currentQuantityOnHand: number | null;
  orderQuantity: number;
  quantityOnHandIncludingThisOrder: number | null;
};

const managerRoles = ["Owner", "Manager", "Admin"];

const lineClassOptions: PurchaseOrderLineClass[] = [
  "Inventory Stock",
  "Company Tools",
  "Repair Order Direct Charge",
];

const receiveLocationTypes: PurchaseOrderReceiveLocationType[] = [
  "Warehouse",
  "Truck",
];

const warehouseRows = ["A", "B", "C", "D", "E", "F"];

const truckCompartments = [
  "Driver Front",
  "Driver Rear",
  "Curbside Front",
  "Curbside Rear",
  "Interior Rack",
  "Rear Drawer",
];

const shelves = ["1", "2", "3", "4", "5"];

const locationNumbers = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
];

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

const primaryButtonClass =
  "cursor-pointer rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80 active:scale-[0.99]";

const secondaryButtonClass =
  "cursor-pointer rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100 active:scale-[0.99]";

const warningButtonClass =
  "cursor-pointer rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 active:scale-[0.99]";

const dangerButtonClass =
  "cursor-pointer rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 active:scale-[0.99]";

const smallMutedTextClass = "text-sm text-black/60";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const formatCurrency = (value: number | undefined) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value ?? 0));
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

function normalizeNumber(value: string | number | undefined) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function getSelectedPurchaseOrderIdFromUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);

  return searchParams.get("poId");
}

function getPurchaseOrderNumber(purchaseOrder: PurchaseOrder) {
  return (
    purchaseOrder.purchaseOrderNumber ??
    purchaseOrder.poNumber ??
    purchaseOrder.id
  );
}

function getSupplierName(purchaseOrder: PurchaseOrder) {
  return (
    purchaseOrder.supplierName ??
    purchaseOrder.supplier ??
    "Unassigned Supplier"
  );
}

function isReceivingLineClass(lineClass: PurchaseOrderLineClass) {
  return lineClass === "Inventory Stock" || lineClass === "Company Tools";
}

function isOpenPurchaseOrder(purchaseOrder: PurchaseOrder) {
  return (
    purchaseOrder.status !== "Received" &&
    purchaseOrder.status !== "Cancelled"
  );
}

function buildStructuredBinLocation(input: {
  stockLocationKind?: StockLocationKind;
  warehouseRow?: string;
  truckCompartment?: string;
  shelf?: string;
  locationNumber?: string;
}) {
  const stockLocationKind = input.stockLocationKind ?? "Warehouse";

  if (stockLocationKind === "Truck") {
    return [
      "Truck",
      input.truckCompartment ? `Compartment ${input.truckCompartment}` : "",
      input.shelf ? `Shelf ${input.shelf}` : "",
      input.locationNumber ? `Location ${input.locationNumber}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  }

  return [
    "Warehouse",
    input.warehouseRow ? `Row ${input.warehouseRow}` : "",
    input.shelf ? `Shelf ${input.shelf}` : "",
    input.locationNumber ? `Location ${input.locationNumber}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function isCompleteStructuredBinLocation(line: PurchaseOrderLine) {
  const binLocation = line.binLocation ?? "";

  if (line.receiveLocationType === "Truck") {
    return (
      binLocation.includes("Truck") &&
      binLocation.includes("Compartment") &&
      binLocation.includes("Shelf") &&
      binLocation.includes("Location")
    );
  }

  return (
    binLocation.includes("Warehouse") &&
    binLocation.includes("Row") &&
    binLocation.includes("Shelf") &&
    binLocation.includes("Location")
  );
}

function createEmptyDraftLine(): DraftLine {
  return {
    id: createId(),
    lineClass: "Inventory Stock",
    partNumber: "",
    description: "",
    quantity: "1",
    cost: "0",
    receiveLocationType: "Warehouse",
    receiveLocationId: "warehouse",
    receiveLocationName: "Warehouse",
    stockLocationKind: "Warehouse",
    warehouseRow: "",
    shelf: "",
    locationNumber: "",
    truckCompartment: "",
  };
}

function draftLineToPurchaseOrderLine(draftLine: DraftLine): PurchaseOrderLine {
  const quantity = normalizeNumber(draftLine.quantity);
  const cost = normalizeNumber(draftLine.cost);
  const isReceiving = isReceivingLineClass(draftLine.lineClass);

  return {
    id: draftLine.id,
    lineClass: draftLine.lineClass,
    inventoryItemId: undefined,
    partNumber: draftLine.partNumber.trim(),
    description: draftLine.description.trim(),
    quantity,
    cost,
    total: quantity * cost,
    receiveLocationId: isReceiving
      ? draftLine.receiveLocationId ?? "warehouse"
      : undefined,
    receiveLocationName: isReceiving
      ? draftLine.receiveLocationName ?? "Warehouse"
      : undefined,
    receiveLocationType: isReceiving ? draftLine.receiveLocationType : undefined,
    binLocation: isReceiving
      ? buildStructuredBinLocation({
          stockLocationKind: draftLine.stockLocationKind,
          warehouseRow: draftLine.warehouseRow,
          truckCompartment: draftLine.truckCompartment,
          shelf: draftLine.shelf,
          locationNumber: draftLine.locationNumber,
        })
      : undefined,
    repairOrderId:
      draftLine.lineClass === "Repair Order Direct Charge"
        ? draftLine.repairOrderId
        : undefined,
    repairOrderNumber:
      draftLine.lineClass === "Repair Order Direct Charge"
        ? draftLine.repairOrderNumber
        : undefined,
    repairOrderLineId:
      draftLine.lineClass === "Repair Order Direct Charge"
        ? draftLine.repairOrderLineId
        : undefined,
    repairOrderLineLabel:
      draftLine.lineClass === "Repair Order Direct Charge"
        ? draftLine.repairOrderLineLabel
        : undefined,
  };
}

function purchaseOrderLineToDraftLine(line: PurchaseOrderLine): DraftLine {
  const receiveLocationType = line.receiveLocationType ?? "Warehouse";
  const binLocation = line.binLocation ?? "";

  const stockLocationKind: StockLocationKind =
    receiveLocationType === "Truck" || binLocation.includes("Truck")
      ? "Truck"
      : "Warehouse";

  const warehouseRowMatch = binLocation.match(/Row ([^|]+)/);
  const truckCompartmentMatch = binLocation.match(/Compartment ([^|]+)/);
  const shelfMatch = binLocation.match(/Shelf ([^|]+)/);
  const locationMatch = binLocation.match(/Location ([^|]+)/);

  return {
    id: line.id,
    lineClass: line.lineClass,
    partNumber: line.partNumber,
    description: line.description,
    quantity: String(line.quantity),
    cost: String(line.cost),
    receiveLocationType,
    receiveLocationId: line.receiveLocationId,
    receiveLocationName: line.receiveLocationName,
    stockLocationKind,
    warehouseRow: warehouseRowMatch?.[1]?.trim() ?? "",
    truckCompartment: truckCompartmentMatch?.[1]?.trim() ?? "",
    shelf: shelfMatch?.[1]?.trim() ?? "",
    locationNumber: locationMatch?.[1]?.trim() ?? "",
    repairOrderId: line.repairOrderId,
    repairOrderNumber: line.repairOrderNumber,
    repairOrderLineId: line.repairOrderLineId,
    repairOrderLineLabel: line.repairOrderLineLabel,
  };
}

function getStatusClass(status: PurchaseOrder["status"]) {
  if (status === "Received") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "Ordered" || status === "Partially Received") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "Cancelled") {
    return "border-zinc-300 bg-zinc-100 text-zinc-600";
  }

  return "border-orange-200 bg-orange-50 text-orange-700";
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const [supplierName, setSupplierName] = useState("");
  const [notes, setNotes] = useState("");

  const [draftLines, setDraftLines] = useState<DraftLine[]>([
    createEmptyDraftLine(),
  ]);

  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  const [selectedStatusTileFilter, setSelectedStatusTileFilter] =
    useState<PurchaseOrderStatusTileFilter>("All");

  const [showCreatePurchaseOrderForm, setShowCreatePurchaseOrderForm] =
    useState(false);

  const [
    recommendedInventoryVisibleByPoId,
    setRecommendedInventoryVisibleByPoId,
  ] = useState<Record<string, boolean>>({});

  const [
    selectedRecommendedInventoryByPoId,
    setSelectedRecommendedInventoryByPoId,
  ] = useState<Record<string, string[]>>({});

  const [
    verifiedLiveInventoryCountByLineId,
    setVerifiedLiveInventoryCountByLineId,
  ] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [currentRole, setCurrentRole] = useState("Standard User");

  const [managerCodeByPoId, setManagerCodeByPoId] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const loadedPurchaseOrders = getPurchaseOrders();

    setPurchaseOrders(loadedPurchaseOrders);
    setInventoryItems(getInventoryItems());

    const storedRole = localStorage.getItem("t1eq-current-user");

    if (storedRole) {
      setCurrentRole(storedRole);
    }

    const selectedPurchaseOrderId = getSelectedPurchaseOrderIdFromUrl();

    if (selectedPurchaseOrderId) {
      const selectedPurchaseOrder = loadedPurchaseOrders.find(
        (purchaseOrder) => purchaseOrder.id === selectedPurchaseOrderId
      );

      if (selectedPurchaseOrder) {
        setExpandedPoId(selectedPurchaseOrder.id);
      }
    }
  }, []);

  const isManager = managerRoles.includes(currentRole);

  const recommendedInventoryItems = useMemo(() => {
    return getRecommendedOrderItems();
  }, [inventoryItems]);

  const filteredPurchaseOrders = useMemo(() => {
    const selectedPurchaseOrderId = getSelectedPurchaseOrderIdFromUrl();
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (selectedPurchaseOrderId) {
      const selectedPurchaseOrder = purchaseOrders.find(
        (purchaseOrder) => purchaseOrder.id === selectedPurchaseOrderId
      );

      if (selectedPurchaseOrder) {
        return [selectedPurchaseOrder];
      }
    }

    let filtered = purchaseOrders;

    if (selectedStatusTileFilter === "Open") {
      filtered = filtered.filter((purchaseOrder) => {
        return isOpenPurchaseOrder(purchaseOrder);
      });
    }

    if (selectedStatusTileFilter === "Received") {
      filtered = filtered.filter((purchaseOrder) => {
        return purchaseOrder.status === "Received";
      });
    }

    if (!normalizedSearch) {
      return filtered;
    }

    return filtered.filter((purchaseOrder) => {
      const purchaseOrderNumber = getPurchaseOrderNumber(purchaseOrder);
      const supplier = getSupplierName(purchaseOrder);
      const lines = purchaseOrder.lines ?? [];

      return (
        purchaseOrderNumber.toLowerCase().includes(normalizedSearch) ||
        supplier.toLowerCase().includes(normalizedSearch) ||
        purchaseOrder.status.toLowerCase().includes(normalizedSearch) ||
        lines.some((line) => {
          return (
            line.partNumber.toLowerCase().includes(normalizedSearch) ||
            line.description.toLowerCase().includes(normalizedSearch)
          );
        })
      );
    });
  }, [purchaseOrders, searchTerm, selectedStatusTileFilter]);

  const metrics = useMemo(() => {
    const openPurchaseOrders = purchaseOrders.filter((purchaseOrder) => {
      return isOpenPurchaseOrder(purchaseOrder);
    });

    const receivedPurchaseOrders = purchaseOrders.filter((purchaseOrder) => {
      return purchaseOrder.status === "Received";
    });

    const totalValue = purchaseOrders.reduce((total, purchaseOrder) => {
      return total + (purchaseOrder.total ?? purchaseOrder.totalAmount ?? 0);
    }, 0);

    return {
      total: purchaseOrders.length,
      open: openPurchaseOrders.length,
      received: receivedPurchaseOrders.length,
      totalValue,
    };
  }, [purchaseOrders]);

  function refreshPurchaseOrders() {
    const loadedPurchaseOrders = getPurchaseOrders();

    setPurchaseOrders(loadedPurchaseOrders);

    const selectedPurchaseOrderId = getSelectedPurchaseOrderIdFromUrl();

    if (selectedPurchaseOrderId) {
      const selectedPurchaseOrder = loadedPurchaseOrders.find(
        (purchaseOrder) => purchaseOrder.id === selectedPurchaseOrderId
      );

      if (selectedPurchaseOrder) {
        setExpandedPoId(selectedPurchaseOrder.id);
      }
    }
  }

  function handleManagerLogin(purchaseOrderId: string) {
    const managerCode = managerCodeByPoId[purchaseOrderId] ?? "";

    if (managerCode.trim().toLowerCase() !== "manager") {
      alert("Invalid manager code.");
      return;
    }

    localStorage.setItem("t1eq-current-user", "Manager");
    setCurrentRole("Manager");

    setManagerCodeByPoId((current) => ({
      ...current,
      [purchaseOrderId]: "",
    }));
  }

  function updateManagerCode(purchaseOrderId: string, value: string) {
    setManagerCodeByPoId((current) => ({
      ...current,
      [purchaseOrderId]: value,
    }));
  }

  function handleManagerLogout() {
    localStorage.setItem("t1eq-current-user", "Standard User");
    setCurrentRole("Standard User");
  }

  function isPurchaseOrderLocked(purchaseOrder: PurchaseOrder) {
    return purchaseOrder.status === "Received" && !isManager;
  }

  function updateDraftLine(lineId: string, updates: Partial<DraftLine>) {
    setDraftLines((current) => {
      return current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        const updatedLine: DraftLine = {
          ...line,
          ...updates,
        };

        if (updates.lineClass) {
          if (updates.lineClass === "Repair Order Direct Charge") {
            updatedLine.receiveLocationType = "Warehouse";
            updatedLine.receiveLocationId = undefined;
            updatedLine.receiveLocationName = undefined;
            updatedLine.stockLocationKind = "Warehouse";
            updatedLine.warehouseRow = "";
            updatedLine.truckCompartment = "";
            updatedLine.shelf = "";
            updatedLine.locationNumber = "";
          } else {
            updatedLine.receiveLocationType = "Warehouse";
            updatedLine.receiveLocationId = "warehouse";
            updatedLine.receiveLocationName = "Warehouse";
            updatedLine.stockLocationKind = "Warehouse";
          }
        }

        if (updates.receiveLocationType) {
          updatedLine.stockLocationKind =
            updates.receiveLocationType === "Truck" ? "Truck" : "Warehouse";

          updatedLine.receiveLocationId =
            updates.receiveLocationType === "Truck" ? "truck" : "warehouse";

          updatedLine.receiveLocationName =
            updates.receiveLocationType === "Truck" ? "Truck" : "Warehouse";
        }

        return updatedLine;
      });
    });
  }

  function addDraftLine() {
    setDraftLines((current) => [...current, createEmptyDraftLine()]);
  }

  function removeDraftLine(lineId: string) {
    setDraftLines((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((line) => line.id !== lineId);
    });
  }

  function resetDraftForm() {
    setSupplierName("");
    setNotes("");
    setDraftLines([createEmptyDraftLine()]);
    setEditingPoId(null);
    setShowCreatePurchaseOrderForm(false);
  }

  function validateDraftLines() {
    if (!supplierName.trim()) {
      alert("Supplier name is required.");
      return false;
    }

    if (draftLines.length === 0) {
      alert("At least one purchase order line is required.");
      return false;
    }

    for (const draftLine of draftLines) {
      if (!draftLine.partNumber.trim() && !draftLine.description.trim()) {
        alert("Every line needs a part number or description.");
        return false;
      }

      if (normalizeNumber(draftLine.quantity) <= 0) {
        alert("Every line needs a quantity greater than zero.");
        return false;
      }

      if (normalizeNumber(draftLine.cost) < 0) {
        alert("Line cost cannot be negative.");
        return false;
      }
    }

    return true;
  }

  function handleCreateOrUpdatePurchaseOrder() {
    if (!validateDraftLines()) {
      return;
    }

    const lines = draftLines.map((draftLine) =>
      draftLineToPurchaseOrderLine(draftLine)
    );

    if (editingPoId) {
      updatePurchaseOrder(editingPoId, {
        supplierName: supplierName.trim(),
        supplier: supplierName.trim(),
        notes,
        lines,
      });

      refreshPurchaseOrders();
      resetDraftForm();
      return;
    }

    createPurchaseOrder({
      supplierName: supplierName.trim(),
      supplier: supplierName.trim(),
      status: "Draft",
      notes,
      lines,
    });

    refreshPurchaseOrders();
    resetDraftForm();
    setSelectedStatusTileFilter("All");
  }

  function beginEditPurchaseOrder(purchaseOrder: PurchaseOrder) {
    if (isPurchaseOrderLocked(purchaseOrder)) {
      alert("Received purchase orders are locked. Manager access is required.");
      return;
    }

    setEditingPoId(purchaseOrder.id);
    setSupplierName(getSupplierName(purchaseOrder));
    setNotes(purchaseOrder.notes ?? "");

    const lines = purchaseOrder.lines ?? [];

    setDraftLines(
      lines.length > 0
        ? lines.map((line) => purchaseOrderLineToDraftLine(line))
        : [createEmptyDraftLine()]
    );

    setExpandedPoId(purchaseOrder.id);
    setShowCreatePurchaseOrderForm(true);
  }

  function handleDeletePurchaseOrder(purchaseOrder: PurchaseOrder) {
    if (isPurchaseOrderLocked(purchaseOrder)) {
      alert("Received purchase orders are locked. Manager access is required.");
      return;
    }

    deletePurchaseOrder(purchaseOrder.id);
    refreshPurchaseOrders();
  }

  function handleMarkOrdered(purchaseOrder: PurchaseOrder) {
    if (isPurchaseOrderLocked(purchaseOrder)) {
      alert("Received purchase orders are locked. Manager access is required.");
      return;
    }

    updatePurchaseOrder(purchaseOrder.id, {
      status: "Ordered",
      orderedDate: new Date().toISOString(),
      orderDate: purchaseOrder.orderDate ?? new Date().toISOString(),
    });

    refreshPurchaseOrders();
  }

  function handleRecalculateTotals(purchaseOrder: PurchaseOrder) {
    if (isPurchaseOrderLocked(purchaseOrder)) {
      alert("Received purchase orders are locked. Manager access is required.");
      return;
    }

    updatePurchaseOrder(purchaseOrder.id, {
      lines: purchaseOrder.lines ?? [],
    });

    refreshPurchaseOrders();
  }

  function findInventoryItemByPartNumber(partNumber: string) {
    const normalizedPartNumber = partNumber.trim().toLowerCase();

    if (!normalizedPartNumber) {
      return undefined;
    }

    return inventoryItems.find((item) => {
      return item.partNumber.trim().toLowerCase() === normalizedPartNumber;
    });
  }

  function getQuantityProjection(line: PurchaseOrderLine): QuantityProjection {
    const inventoryItem = findInventoryItemByPartNumber(line.partNumber);

    if (!inventoryItem) {
      return {
        inventoryItem: undefined,
        currentQuantityOnHand: null,
        orderQuantity: line.quantity,
        quantityOnHandIncludingThisOrder: null,
      };
    }

    return {
      inventoryItem,
      currentQuantityOnHand: inventoryItem.quantityOnHand,
      orderQuantity: line.quantity,
      quantityOnHandIncludingThisOrder:
        inventoryItem.quantityOnHand + line.quantity,
    };
  }

  function getVerifiedLiveInventoryCount(lineId: string) {
    const value = verifiedLiveInventoryCountByLineId[lineId];

    if (value === undefined || value.trim() === "") {
      return null;
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  }

  function updateVerifiedLiveInventoryCount(lineId: string, value: string) {
    setVerifiedLiveInventoryCountByLineId((current) => ({
      ...current,
      [lineId]: value,
    }));
  }

  function createReceivingDiscrepancyIfNeeded(
    purchaseOrder: PurchaseOrder,
    line: PurchaseOrderLine
  ) {
    if (line.lineClass !== "Inventory Stock") {
      return;
    }

    const projection = getQuantityProjection(line);
    const verifiedLiveInventoryCount = getVerifiedLiveInventoryCount(line.id);

    if (!projection.inventoryItem) {
      createInventoryDiscrepancy({
        source: "Purchase Order Receiving",
        inventoryItemId: undefined,
        partNumber: line.partNumber,
        description: line.description,
        purchaseOrderId: purchaseOrder.id,
        purchaseOrderNumber: getPurchaseOrderNumber(purchaseOrder),
        purchaseOrderLineId: line.id,
        expectedQuantityOnHand: line.quantity,
        liveInventoryCount: verifiedLiveInventoryCount ?? 0,
        discrepancyQuantity: (verifiedLiveInventoryCount ?? 0) - line.quantity,
        locationId: line.receiveLocationId,
        locationName: line.receiveLocationName,
        binLocation: line.binLocation,
        notes:
          "PO received an inventory stock line that does not match an existing inventory record by part number. Inventory Receiving must create or match the stock record.",
      });

      return;
    }

    if (projection.quantityOnHandIncludingThisOrder === null) {
      return;
    }

    if (verifiedLiveInventoryCount === null) {
      return;
    }

    const discrepancyQuantity =
      verifiedLiveInventoryCount - projection.quantityOnHandIncludingThisOrder;

    if (discrepancyQuantity === 0) {
      return;
    }

    createInventoryDiscrepancy({
      source: "Purchase Order Receiving",
      inventoryItemId: projection.inventoryItem.id,
      partNumber: line.partNumber,
      description: line.description,
      purchaseOrderId: purchaseOrder.id,
      purchaseOrderNumber: getPurchaseOrderNumber(purchaseOrder),
      purchaseOrderLineId: line.id,
      expectedQuantityOnHand: projection.quantityOnHandIncludingThisOrder,
      liveInventoryCount: verifiedLiveInventoryCount,
      discrepancyQuantity,
      locationId: line.receiveLocationId,
      locationName: line.receiveLocationName,
      binLocation: line.binLocation,
      notes:
        "Verified live inventory count does not match expected quantity on hand including this PO receipt.",
    });
  }

  function handleReceivePurchaseOrder(purchaseOrder: PurchaseOrder) {
    if (isPurchaseOrderLocked(purchaseOrder)) {
      alert("Received purchase orders are locked. Manager access is required.");
      return;
    }

    const lines = purchaseOrder.lines ?? [];

    const receivingLines = lines.filter((line) => {
      return isReceivingLineClass(line.lineClass);
    });

    if (receivingLines.length === 0) {
      alert(
        "This purchase order has no Inventory Stock or Company Tools lines to receive."
      );

      return;
    }

    const incompleteReceivingLines = receivingLines.filter((line) => {
      return !isCompleteStructuredBinLocation(line);
    });

    if (incompleteReceivingLines.length > 0) {
      alert(
        "Every Inventory Stock and Company Tools line must have a complete structured storage location before receiving."
      );

      return;
    }

    const missingVerifiedCounts = receivingLines.filter((line) => {
      if (line.lineClass !== "Inventory Stock") {
        return false;
      }

      return getVerifiedLiveInventoryCount(line.id) === null;
    });

    if (missingVerifiedCounts.length > 0) {
      alert(
        "Every Inventory Stock line must have a Verified Live Inventory Count before receiving."
      );

      return;
    }

    const purchaseOrderNumber = getPurchaseOrderNumber(purchaseOrder);

    receivingLines.forEach((line) => {
      const projection = getQuantityProjection(line);
      const verifiedLiveInventoryCount = getVerifiedLiveInventoryCount(line.id);
      const receiveLocationName = line.receiveLocationName ?? "Warehouse";

      if (line.lineClass === "Company Tools") {
        createCompanyTool({
          toolName: line.description || line.partNumber || "Company Tool",
          description: line.description,
          manufacturer: "",
          modelNumber: "",
          serialNumber: "",
          purchaseOrderId: purchaseOrder.id,
          purchaseOrderNumber,
          purchaseOrderLineId: line.id,
          cost: line.cost,
          purchaseDate: new Date().toISOString(),
          status: "Available",
          locationType:
            line.receiveLocationType === "Truck" ? "Truck" : "Warehouse",
          locationName: receiveLocationName,
          binLocation: line.binLocation ?? "",
          notes:
            "Created automatically from Purchase Order receiving. Add receipt photo, tool photos, serial number, asset metadata, and custody details in Company Tools.",
        });
      }

      createReceivingDiscrepancyIfNeeded(purchaseOrder, line);

      console.info({
        source: "Purchase Order Receiving",
        purchaseOrderId: purchaseOrder.id,
        purchaseOrderNumber,
        lineClass: line.lineClass,
        partNumber: line.partNumber,
        description: line.description,
        receivedQuantity: line.quantity,
        receiveLocationName,
        binLocation: line.binLocation,
        currentQuantityOnHand:
          line.lineClass === "Inventory Stock"
            ? projection.currentQuantityOnHand
            : null,
        quantityOnHandIncludingThisOrder:
          line.lineClass === "Inventory Stock"
            ? projection.quantityOnHandIncludingThisOrder
            : null,
        verifiedLiveInventoryCount:
          line.lineClass === "Inventory Stock"
            ? verifiedLiveInventoryCount
            : null,
        note:
          line.lineClass === "Company Tools"
            ? "Company tool received. A company tool asset record was created automatically."
            : projection.quantityOnHandIncludingThisOrder === null
              ? "No existing inventory match by part number. Inventory Receiving will create or match the stock record."
              : "Existing inventory match found by part number. Inventory Receiving owns final stock metadata, photos, receipts, transfers, and adjustments.",
      });
    });

    updatePurchaseOrder(purchaseOrder.id, {
      status: "Received",
      receivedDate: new Date().toISOString(),
    });

    refreshPurchaseOrders();
    setSelectedStatusTileFilter("Received");
  }

  function getRecommendedQuantity(item: InventoryItem) {
    const minimumQuantity = item.minimumStock ?? item.minimumQuantity ?? 0;
    const idealStock = item.idealStock ?? minimumQuantity;

    return Math.max(idealStock - item.quantityOnHand, 1);
  }

  function getRecommendedUnitCost(item: InventoryItem) {
    return item.cost ?? 0;
  }

  function getRecommendedLineTotal(item: InventoryItem) {
    return getRecommendedQuantity(item) * getRecommendedUnitCost(item);
  }

  function toggleRecommendedInventoryPanel(purchaseOrderId: string) {
    setRecommendedInventoryVisibleByPoId((current) => ({
      ...current,
      [purchaseOrderId]: !current[purchaseOrderId],
    }));
  }

  function toggleRecommendedInventorySelection(
    purchaseOrderId: string,
    inventoryItemId: string
  ) {
    setSelectedRecommendedInventoryByPoId((current) => {
      const selectedIds = current[purchaseOrderId] ?? [];

      const updatedSelectedIds = selectedIds.includes(inventoryItemId)
        ? selectedIds.filter((id) => id !== inventoryItemId)
        : [...selectedIds, inventoryItemId];

      return {
        ...current,
        [purchaseOrderId]: updatedSelectedIds,
      };
    });
  }

  function selectAllRecommendedInventory(purchaseOrderId: string) {
    setSelectedRecommendedInventoryByPoId((current) => ({
      ...current,
      [purchaseOrderId]: recommendedInventoryItems.map((item) => item.id),
    }));
  }

  function unselectAllRecommendedInventory(purchaseOrderId: string) {
    setSelectedRecommendedInventoryByPoId((current) => ({
      ...current,
      [purchaseOrderId]: [],
    }));
  }

  function getSelectedRecommendedInventoryTotals(purchaseOrderId: string) {
    const selectedIds = selectedRecommendedInventoryByPoId[purchaseOrderId] ?? [];

    const selectedItems = recommendedInventoryItems.filter((item) => {
      return selectedIds.includes(item.id);
    });

    const selectedQuantity = selectedItems.reduce((total, item) => {
      return total + getRecommendedQuantity(item);
    }, 0);

    const selectedValue = selectedItems.reduce((total, item) => {
      return total + getRecommendedLineTotal(item);
    }, 0);

    return {
      selectedCount: selectedItems.length,
      selectedQuantity,
      selectedValue,
    };
  }

  function addSelectedRecommendedInventoryToPurchaseOrder(
    purchaseOrder: PurchaseOrder
  ) {
    if (isPurchaseOrderLocked(purchaseOrder)) {
      alert("Received purchase orders are locked. Manager access is required.");
      return;
    }

    const selectedIds =
      selectedRecommendedInventoryByPoId[purchaseOrder.id] ?? [];

    if (selectedIds.length === 0) {
      alert("Select at least one recommended inventory item.");
      return;
    }

    const selectedItems = recommendedInventoryItems.filter((item) => {
      return selectedIds.includes(item.id);
    });

    const newLines: PurchaseOrderLine[] = selectedItems.map((item) => {
      const quantity = getRecommendedQuantity(item);
      const cost = getRecommendedUnitCost(item);

      return {
        id: createId(),
        lineClass: "Inventory Stock",
        inventoryItemId: undefined,
        partNumber: item.partNumber,
        description: item.description ?? item.name ?? item.partNumber,
        quantity,
        cost,
        total: quantity * cost,
        receiveLocationId: "warehouse",
        receiveLocationName: "Warehouse",
        receiveLocationType: "Warehouse",
        binLocation: "",
      };
    });

    updatePurchaseOrder(purchaseOrder.id, {
      lines: [...(purchaseOrder.lines ?? []), ...newLines],
    });

    setSelectedRecommendedInventoryByPoId((current) => ({
      ...current,
      [purchaseOrder.id]: [],
    }));

    setRecommendedInventoryVisibleByPoId((current) => ({
      ...current,
      [purchaseOrder.id]: false,
    }));

    refreshPurchaseOrders();
  }

  function renderStructuredLocationFields(draftLine: DraftLine) {
    if (!isReceivingLineClass(draftLine.lineClass)) {
      return null;
    }

    return (
      <div className="grid gap-3 md:grid-cols-4">
        <label className="space-y-1">
          <span className={smallMutedTextClass}>Location Type</span>

          <select
            value={draftLine.receiveLocationType}
            onChange={(event) =>
              updateDraftLine(draftLine.id, {
                receiveLocationType: event.target
                  .value as PurchaseOrderReceiveLocationType,
              })
            }
            className={inputClass}
          >
            {receiveLocationTypes.map((receiveLocationType) => (
              <option key={receiveLocationType} value={receiveLocationType}>
                {receiveLocationType}
              </option>
            ))}
          </select>
        </label>

        {draftLine.receiveLocationType === "Truck" ? (
          <label className="space-y-1">
            <span className={smallMutedTextClass}>Compartment</span>

            <select
              value={draftLine.truckCompartment ?? ""}
              onChange={(event) =>
                updateDraftLine(draftLine.id, {
                  truckCompartment: event.target.value,
                })
              }
              className={inputClass}
            >
              <option value="">Select compartment</option>

              {truckCompartments.map((compartment) => (
                <option key={compartment} value={compartment}>
                  {compartment}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="space-y-1">
            <span className={smallMutedTextClass}>Row</span>

            <select
              value={draftLine.warehouseRow ?? ""}
              onChange={(event) =>
                updateDraftLine(draftLine.id, {
                  warehouseRow: event.target.value,
                })
              }
              className={inputClass}
            >
              <option value="">Select row</option>

              {warehouseRows.map((row) => (
                <option key={row} value={row}>
                  {row}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="space-y-1">
          <span className={smallMutedTextClass}>Shelf</span>

          <select
            value={draftLine.shelf ?? ""}
            onChange={(event) =>
              updateDraftLine(draftLine.id, {
                shelf: event.target.value,
              })
            }
            className={inputClass}
          >
            <option value="">Select shelf</option>

            {shelves.map((shelf) => (
              <option key={shelf} value={shelf}>
                {shelf}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className={smallMutedTextClass}>Location #</span>

          <select
            value={draftLine.locationNumber ?? ""}
            onChange={(event) =>
              updateDraftLine(draftLine.id, {
                locationNumber: event.target.value,
              })
            }
            className={inputClass}
          >
            <option value="">Select location</option>

            {locationNumbers.map((locationNumber) => (
              <option key={locationNumber} value={locationNumber}>
                {locationNumber}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-6 text-black">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h1 className="text-5xl font-bold text-black">
                Purchase Orders
              </h1>

              <p className="mt-2 text-lg text-black/70">
                Supplier purchasing, repair order direct charges, inventory
                stock receiving, company tools, structured storage, and
                discrepancy handoff.
              </p>

              <p className="mt-2 text-sm font-semibold text-black/50">
                Active role: {currentRole}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={refreshPurchaseOrders}
                className={secondaryButtonClass}
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={() => {
                  resetDraftForm();
                  setShowCreatePurchaseOrderForm(true);
                }}
                className={primaryButtonClass}
              >
                Create Purchase Order
              </button>

              {isManager && (
                <button
                  type="button"
                  onClick={handleManagerLogout}
                  className={secondaryButtonClass}
                >
                  Manager Logout
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <button
            type="button"
            onClick={() => setSelectedStatusTileFilter("All")}
            className={`cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
              selectedStatusTileFilter === "All"
                ? "border-black"
                : "border-zinc-200"
            }`}
          >
            <div className="text-sm font-semibold uppercase tracking-wide text-black/50">
              Total POs
            </div>

            <div className="mt-2 text-3xl font-bold">{metrics.total}</div>

            <div className="mt-3 text-sm font-semibold text-black">
              Show all →
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTileFilter("Open")}
            className={`cursor-pointer rounded-2xl border bg-orange-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
              selectedStatusTileFilter === "Open"
                ? "border-orange-700"
                : "border-orange-200"
            }`}
          >
            <div className="text-sm font-semibold uppercase tracking-wide text-orange-700">
              Open
            </div>

            <div className="mt-2 text-3xl font-bold text-orange-700">
              {metrics.open}
            </div>

            <div className="mt-3 text-sm font-semibold text-orange-700">
              Show open →
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTileFilter("Received")}
            className={`cursor-pointer rounded-2xl border bg-green-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
              selectedStatusTileFilter === "Received"
                ? "border-green-700"
                : "border-green-200"
            }`}
          >
            <div className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Received
            </div>

            <div className="mt-2 text-3xl font-bold text-green-700">
              {metrics.received}
            </div>

            <div className="mt-3 text-sm font-semibold text-green-700">
              Show received →
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTileFilter("All")}
            className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
          >
            <div className="text-sm font-semibold uppercase tracking-wide text-black/50">
              Total Value
            </div>

            <div className="mt-2 text-3xl font-bold">
              {formatCurrency(metrics.totalValue)}
            </div>

            <div className="mt-3 text-sm font-semibold text-black">
              Show all →
            </div>
          </button>
        </section>

        {showCreatePurchaseOrderForm && (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-bold">
              {editingPoId ? "Edit Purchase Order" : "Create Purchase Order"}
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="space-y-1">
                <span className={smallMutedTextClass}>Supplier</span>

                <input
                  value={supplierName}
                  onChange={(event) => setSupplierName(event.target.value)}
                  placeholder="Supplier name"
                  className={inputClass}
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className={smallMutedTextClass}>Notes</span>

                <input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="PO notes"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-5 space-y-4">
              {draftLines.map((draftLine, index) => (
                <div
                  key={draftLine.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-bold">Line {index + 1}</div>

                    <button
                      type="button"
                      onClick={() => removeDraftLine(draftLine.id)}
                      className={dangerButtonClass}
                    >
                      Remove Line
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-5">
                    <label className="space-y-1">
                      <span className={smallMutedTextClass}>Line Class</span>

                      <select
                        value={draftLine.lineClass}
                        onChange={(event) =>
                          updateDraftLine(draftLine.id, {
                            lineClass: event.target
                              .value as PurchaseOrderLineClass,
                          })
                        }
                        className={inputClass}
                      >
                        {lineClassOptions.map((lineClass) => (
                          <option key={lineClass} value={lineClass}>
                            {lineClass}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className={smallMutedTextClass}>Part Number</span>

                      <input
                        value={draftLine.partNumber}
                        onChange={(event) =>
                          updateDraftLine(draftLine.id, {
                            partNumber: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="space-y-1 md:col-span-2">
                      <span className={smallMutedTextClass}>Description</span>

                      <input
                        value={draftLine.description}
                        onChange={(event) =>
                          updateDraftLine(draftLine.id, {
                            description: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="space-y-1">
                      <span className={smallMutedTextClass}>Quantity</span>

                      <input
                        type="number"
                        min="1"
                        value={draftLine.quantity}
                        onChange={(event) =>
                          updateDraftLine(draftLine.id, {
                            quantity: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="space-y-1">
                      <span className={smallMutedTextClass}>Unit Cost</span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draftLine.cost}
                        onChange={(event) =>
                          updateDraftLine(draftLine.id, {
                            cost: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </label>

                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className={smallMutedTextClass}>Line Total</div>

                      <div className="text-xl font-bold">
                        {formatCurrency(
                          normalizeNumber(draftLine.quantity) *
                            normalizeNumber(draftLine.cost)
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    {renderStructuredLocationFields(draftLine)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addDraftLine}
                className={secondaryButtonClass}
              >
                Add Line
              </button>

              <button
                type="button"
                onClick={handleCreateOrUpdatePurchaseOrder}
                className={primaryButtonClass}
              >
                {editingPoId ? "Save Purchase Order" : "Create Purchase Order"}
              </button>

              {!editingPoId && (
                <button
                  type="button"
                  onClick={resetDraftForm}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
              )}

              {editingPoId && (
                <button
                  type="button"
                  onClick={resetDraftForm}
                  className={secondaryButtonClass}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 md:col-span-2">
              <span className={smallMutedTextClass}>
                Search Purchase Orders
              </span>

              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search PO, supplier, status, part, description..."
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-bold">Purchase Order List</h2>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-semibold text-black/60">
              Filter: {selectedStatusTileFilter ?? "None"}
            </div>

            {selectedStatusTileFilter && (
              <button
                type="button"
                onClick={() => setSelectedStatusTileFilter(null)}
                className={secondaryButtonClass}
              >
                Clear Tile Filter
              </button>
            )}
          </div>

          {filteredPurchaseOrders.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
              <div className="text-xl font-bold">No purchase orders found</div>

              <p className="mt-2 text-black/60">
                Create a purchase order to begin procurement and receiving.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredPurchaseOrders.map((purchaseOrder) => {
                const purchaseOrderNumber =
                  getPurchaseOrderNumber(purchaseOrder);

                const lines = purchaseOrder.lines ?? [];
                const isExpanded = expandedPoId === purchaseOrder.id;
                const isLocked = isPurchaseOrderLocked(purchaseOrder);

                const inventoryLineCount = lines.filter((line) => {
                  return line.lineClass === "Inventory Stock";
                }).length;

                const companyToolLineCount = lines.filter((line) => {
                  return line.lineClass === "Company Tools";
                }).length;

                const directChargeLineCount = lines.filter((line) => {
                  return line.lineClass === "Repair Order Direct Charge";
                }).length;

                const selectedRecommendedTotals =
                  getSelectedRecommendedInventoryTotals(purchaseOrder.id);

                return (
                  <article
                    key={purchaseOrder.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <div className="text-2xl font-bold">
                          {purchaseOrderNumber}
                        </div>

                        <div className="text-black/70">
                          {getSupplierName(purchaseOrder)}
                        </div>

                        <div className="mt-2 text-sm text-black/50">
                          Created: {formatDate(purchaseOrder.createdDate)}
                        </div>

                        <div className="text-sm text-black/50">
                          Received: {formatDate(purchaseOrder.receivedDate)}
                        </div>

                        <div className="mt-2 text-sm text-black/60">
                          {inventoryLineCount} inventory stock line(s),{" "}
                          {companyToolLineCount} company tool line(s),{" "}
                          {directChargeLineCount} repair order direct charge
                          line(s)
                        </div>
                      </div>

                      <div className="space-y-2 md:text-right">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClass(
                            purchaseOrder.status
                          )}`}
                        >
                          {purchaseOrder.status}
                        </span>

                        <div className="text-3xl font-bold">
                          {formatCurrency(
                            purchaseOrder.total ?? purchaseOrder.totalAmount
                          )}
                        </div>

                        {isLocked && (
                          <div className="text-sm font-semibold text-orange-700">
                            Completed PO locked
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPoId(isExpanded ? null : purchaseOrder.id)
                        }
                        className={secondaryButtonClass}
                      >
                        {isExpanded ? "Hide Details" : "Show Details"}
                      </button>

                      {!isLocked && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              beginEditPurchaseOrder(purchaseOrder)
                            }
                            className={secondaryButtonClass}
                          >
                            Edit PO
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMarkOrdered(purchaseOrder)}
                            className={secondaryButtonClass}
                          >
                            Mark Ordered
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleRecommendedInventoryPanel(purchaseOrder.id)
                            }
                            className={secondaryButtonClass}
                          >
                            Show Recommended Inventory
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleReceivePurchaseOrder(purchaseOrder)
                            }
                            className={warningButtonClass}
                          >
                            Receive PO
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleRecalculateTotals(purchaseOrder)
                            }
                            className={secondaryButtonClass}
                          >
                            Recalculate Totals
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeletePurchaseOrder(purchaseOrder)
                            }
                            className={dangerButtonClass}
                          >
                            Delete PO
                          </button>
                        </>
                      )}
                    </div>

                    {isLocked && !isManager && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3">
                        <div className="w-full text-sm font-semibold text-orange-700 md:w-auto">
                          Completed PO locked. Manager login required for
                          changes.
                        </div>

                        <input
                          value={managerCodeByPoId[purchaseOrder.id] ?? ""}
                          onChange={(event) =>
                            updateManagerCode(
                              purchaseOrder.id,
                              event.target.value
                            )
                          }
                          placeholder="Manager code"
                          className="w-40 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-black outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => handleManagerLogin(purchaseOrder.id)}
                          className={warningButtonClass}
                        >
                          Manager Login
                        </button>
                      </div>
                    )}

                    {recommendedInventoryVisibleByPoId[purchaseOrder.id] && (
                      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4">
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                          <div>
                            <h3 className="text-xl font-bold">
                              Recommended Inventory
                            </h3>

                            <p className="mt-1 text-sm text-black/60">
                              Select low-stock inventory items to add as
                              Inventory Stock lines.
                            </p>
                          </div>

                          <div className="text-sm font-semibold text-black/60">
                            Selected:{" "}
                            {selectedRecommendedTotals.selectedCount} item(s),{" "}
                            {selectedRecommendedTotals.selectedQuantity} qty,{" "}
                            {formatCurrency(
                              selectedRecommendedTotals.selectedValue
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              selectAllRecommendedInventory(purchaseOrder.id)
                            }
                            className={secondaryButtonClass}
                          >
                            Select All
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              unselectAllRecommendedInventory(purchaseOrder.id)
                            }
                            className={secondaryButtonClass}
                          >
                            Unselect All
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              addSelectedRecommendedInventoryToPurchaseOrder(
                                purchaseOrder
                              )
                            }
                            className={primaryButtonClass}
                          >
                            Add Selected to PO
                          </button>
                        </div>

                        {recommendedInventoryItems.length === 0 ? (
                          <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center text-black/60">
                            No recommended inventory items found.
                          </div>
                        ) : (
                          <div className="mt-4 space-y-2">
                            {recommendedInventoryItems.map((item) => {
                              const selectedIds =
                                selectedRecommendedInventoryByPoId[
                                  purchaseOrder.id
                                ] ?? [];

                              const isSelected = selectedIds.includes(item.id);

                              return (
                                <label
                                  key={item.id}
                                  className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        toggleRecommendedInventorySelection(
                                          purchaseOrder.id,
                                          item.id
                                        )
                                      }
                                    />

                                    <div>
                                      <div className="font-bold">
                                        {item.partNumber}
                                      </div>

                                      <div className="text-sm text-black/60">
                                        {item.description ??
                                          item.name ??
                                          "No description"}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right text-sm">
                                    <div>
                                      Qty: {getRecommendedQuantity(item)}
                                    </div>

                                    <div>
                                      Value:{" "}
                                      {formatCurrency(
                                        getRecommendedLineTotal(item)
                                      )}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {isExpanded && (
                      <div className="mt-5 space-y-3">
                        {lines.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-5 text-center text-black/60">
                            This purchase order has no lines.
                          </div>
                        ) : (
                          lines.map((line) => {
                            const projection = getQuantityProjection(line);

                            const verifiedLiveInventoryCount =
                              verifiedLiveInventoryCountByLineId[line.id] ?? "";

                            return (
                              <div
                                key={line.id}
                                className="rounded-2xl border border-zinc-200 bg-white p-4"
                              >
                                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                                  <div>
                                    <div className="text-lg font-bold">
                                      {line.partNumber || "No part number"}
                                    </div>

                                    <div className="text-black/70">
                                      {line.description || "No description"}
                                    </div>

                                    <div className="mt-1 text-sm font-semibold text-black/50">
                                      {line.lineClass}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-xl font-bold">
                                      {formatCurrency(line.total)}
                                    </div>

                                    <div className="text-sm text-black/60">
                                      {line.quantity} ×{" "}
                                      {formatCurrency(line.cost)}
                                    </div>
                                  </div>
                                </div>

                                {isReceivingLineClass(line.lineClass) && (
                                  <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                                    <div className="text-sm font-semibold text-black/60">
                                      Receiving Location
                                    </div>

                                    <div className="mt-1 font-bold">
                                      {line.receiveLocationName ?? "Warehouse"}
                                    </div>

                                    <div className="text-sm text-black/60">
                                      {line.binLocation ||
                                        "Structured location not set"}
                                    </div>

                                    <p className="mt-2 text-sm text-black/60">
                                      {line.lineClass === "Company Tools"
                                        ? "Company tool line — receiving this PO creates a Company Tool asset record for serial, photos, receipt, custody, and storage tracking."
                                        : "Inventory stock line — receiving this PO creates discrepancy records when verified live count does not match expected quantity on hand."}
                                    </p>
                                  </div>
                                )}

                                {line.lineClass === "Inventory Stock" && (
                                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                                      <div className="text-sm font-semibold text-black/60">
                                        Current Qty On Hand
                                      </div>

                                      <div className="text-xl font-bold">
                                        {projection.currentQuantityOnHand ??
                                          "New / unmatched"}
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                                      <div className="text-sm font-semibold text-black/60">
                                        Quantity on hand including this order
                                      </div>

                                      <div className="text-xl font-bold">
                                        {projection
                                          .quantityOnHandIncludingThisOrder ??
                                          "Inventory Receiving will create or match the stock record."}
                                      </div>
                                    </div>

                                    <label className="space-y-1">
                                      <span className="text-sm font-semibold text-black/60">
                                        Verified Live Inventory Count
                                      </span>

                                      <input
                                        type="number"
                                        min="0"
                                        value={verifiedLiveInventoryCount}
                                        onChange={(event) =>
                                          updateVerifiedLiveInventoryCount(
                                            line.id,
                                            event.target.value
                                          )
                                        }
                                        disabled={
                                          purchaseOrder.status === "Received"
                                        }
                                        className={inputClass}
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}