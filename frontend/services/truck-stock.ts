import type { Truck, TruckStockItem } from "@/types/truck-stock";
import type { InventoryItem } from "@/types/inventory-item";
import { createTruckStockTransaction } from "@/services/truck-stock-transactions";

import {
  getInventoryItemById,
  updateInventoryItem,
} from "@/services/inventory";

const TRUCKS_STORAGE_KEY = "t1eq-trucks";
const TRUCK_STOCK_STORAGE_KEY = "t1eq-truck-stock";

const createId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const getStoredArray = <T>(storageKey: string): T[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = localStorage.getItem(storageKey);

  if (!storedValue) {
    return [];
  }

  try {
    return JSON.parse(storedValue) as T[];
  } catch (error) {
    console.error(`Failed to parse ${storageKey}.`, error);

    return [];
  }
};

const saveStoredArray = <T>(storageKey: string, items: T[]) => {
  localStorage.setItem(storageKey, JSON.stringify(items));
};

export const getTrucks = (): Truck[] => {
  return getStoredArray<Truck>(TRUCKS_STORAGE_KEY);
};

export const saveTrucks = (trucks: Truck[]) => {
  saveStoredArray<Truck>(TRUCKS_STORAGE_KEY, trucks);
};

export const createTruck = (
  truck: Omit<Truck, "id" | "createdDate" | "updatedDate">
): Truck => {
  const now = new Date().toISOString();

  const newTruck: Truck = {
    id: createId("TRUCK"),
    ...truck,
    createdDate: now,
    updatedDate: now,
  };

  saveTrucks([newTruck, ...getTrucks()]);

  return newTruck;
};

export const updateTruck = (
  truckId: string,
  updates: Partial<Truck>
): Truck | null => {
  const trucks = getTrucks();

  const existingTruck = trucks.find((truck) => truck.id === truckId);

  if (!existingTruck) {
    return null;
  }

  const updatedTruck: Truck = {
    ...existingTruck,
    ...updates,
    updatedDate: new Date().toISOString(),
  };

  saveTrucks(
    trucks.map((truck) =>
      truck.id === truckId ? updatedTruck : truck
    )
  );

  return updatedTruck;
};

export const deleteTruck = (truckId: string): void => {
  saveTrucks(getTrucks().filter((truck) => truck.id !== truckId));

  saveTruckStockItems(
    getTruckStockItems().filter(
      (stockItem) => stockItem.truckId !== truckId
    )
  );
};

export const getTruckById = (truckId: string): Truck | undefined => {
  return getTrucks().find((truck) => truck.id === truckId);
};

export const getTruckStockItems = (): TruckStockItem[] => {
  return getStoredArray<TruckStockItem>(TRUCK_STOCK_STORAGE_KEY);
};

export const saveTruckStockItems = (
  truckStockItems: TruckStockItem[]
): void => {
  saveStoredArray<TruckStockItem>(
    TRUCK_STOCK_STORAGE_KEY,
    truckStockItems
  );
};

export const getTruckStockItemsByTruckId = (
  truckId: string
): TruckStockItem[] => {
  return getTruckStockItems().filter(
    (stockItem) => stockItem.truckId === truckId
  );
};

export const getTruckStockItem = (
  truckId: string,
  inventoryItemId: string
): TruckStockItem | undefined => {
  return getTruckStockItems().find(
    (stockItem) =>
      stockItem.truckId === truckId &&
      stockItem.inventoryItemId === inventoryItemId
  );
};

export const addTruckStockItem = (
  truck: Truck,
  inventoryItem: InventoryItem,
  quantity: number
): TruckStockItem => {
  const truckStockItems = getTruckStockItems();

  const existingStockItem = getTruckStockItem(truck.id, inventoryItem.id);

  if (existingStockItem) {
    const updatedStockItem: TruckStockItem = {
      ...existingStockItem,
      quantityOnTruck:
        existingStockItem.quantityOnTruck + Math.max(quantity, 0),
      updatedDate: new Date().toISOString(),
    };

    saveTruckStockItems(
      truckStockItems.map((stockItem) =>
        stockItem.id === existingStockItem.id
          ? updatedStockItem
          : stockItem
      )
    );

    return updatedStockItem;
  }

  const now = new Date().toISOString();

  const newTruckStockItem: TruckStockItem = {
    id: createId("TRUCK-STOCK"),

    truckId: truck.id,
    truckName: truck.name,

    inventoryItemId: inventoryItem.id,

    partNumber: inventoryItem.partNumber,
    description: inventoryItem.description ?? inventoryItem.name,

    quantityOnTruck: Math.max(quantity, 0),

    minimumQuantity: inventoryItem.minimumQuantity ?? inventoryItem.minimumStock,
    idealQuantity: inventoryItem.idealStock,

    binLocation: inventoryItem.binLocation ?? inventoryItem.location,

    createdDate: now,
    updatedDate: now,
  };

  saveTruckStockItems([newTruckStockItem, ...truckStockItems]);

  return newTruckStockItem;
};

export const updateTruckStockItem = (
  truckStockItemId: string,
  updates: Partial<TruckStockItem>
): TruckStockItem | null => {
  const truckStockItems = getTruckStockItems();

  const existingStockItem = truckStockItems.find(
    (stockItem) => stockItem.id === truckStockItemId
  );

  if (!existingStockItem) {
    return null;
  }

  const updatedStockItem: TruckStockItem = {
    ...existingStockItem,
    ...updates,
    updatedDate: new Date().toISOString(),
  };

  saveTruckStockItems(
    truckStockItems.map((stockItem) =>
      stockItem.id === truckStockItemId
        ? updatedStockItem
        : stockItem
    )
  );

  return updatedStockItem;
};

export const transferInventoryToTruck = (
  truckId: string,
  inventoryItemId: string,
  quantity: number
): TruckStockItem | null => {
  const truck = getTruckById(truckId);
  const inventoryItem = getInventoryItemById(inventoryItemId);

  if (!truck || !inventoryItem) {
    return null;
  }

  const transferQuantity = Math.max(quantity, 0);

  const warehouseQuantity = inventoryItem.quantityOnHand;

  if (transferQuantity > warehouseQuantity) {
    return null;
  }

  updateInventoryItem(inventoryItemId, {
    ...inventoryItem,
    quantityOnHand: warehouseQuantity - transferQuantity,
  });
  createTruckStockTransaction({
  id: crypto.randomUUID(),

  truckId: truck.id,
  truckName: truck.name,

  inventoryItemId: inventoryItem.id,

  partNumber: inventoryItem.partNumber,
  description:
    inventoryItem.description ??
    inventoryItem.name,

  type: "Load",

  quantity: transferQuantity,

  previousQuantity: 0,
  newQuantity: transferQuantity,

  notes: "Loaded from warehouse inventory.",

  createdDate: new Date().toISOString(),
  createdBy: "System",
});

  return addTruckStockItem(truck, inventoryItem, transferQuantity);
};

export const consumeTruckStock = (
  truckId: string,
  inventoryItemId: string,
  quantity: number
): TruckStockItem | null => {
  const stockItem = getTruckStockItem(truckId, inventoryItemId);

  if (!stockItem) {
    return null;
  }

  const consumedQuantity = Math.max(quantity, 0);

  const previousQuantity = stockItem.quantityOnTruck;

  const newQuantity = Math.max(previousQuantity - consumedQuantity, 0);

  const updatedStockItem = updateTruckStockItem(stockItem.id, {
    quantityOnTruck: newQuantity,
  });

  if (updatedStockItem) {
    createTruckStockTransaction({
      id: crypto.randomUUID(),

      truckId,
      truckName: stockItem.truckName,

      inventoryItemId,

      partNumber: stockItem.partNumber,
      description: stockItem.description,

      type: "Consumption",

      quantity: consumedQuantity,

      previousQuantity,
      newQuantity,

      notes: "Consumed from truck stock.",

      createdDate: new Date().toISOString(),
      createdBy: "System",
    });
  }

  return updatedStockItem;
};

export const restoreTruckStock = (
  truckId: string,
  inventoryItemId: string,
  quantity: number
): TruckStockItem | null => {
  const stockItem = getTruckStockItem(truckId, inventoryItemId);

  if (!stockItem) {
    return null;
  }

  const restoredQuantity = Math.max(quantity, 0);

  const previousQuantity = stockItem.quantityOnTruck;

  const newQuantity = previousQuantity + restoredQuantity;

  const updatedStockItem = updateTruckStockItem(stockItem.id, {
    quantityOnTruck: newQuantity,
  });

  if (updatedStockItem) {
    createTruckStockTransaction({
      id: crypto.randomUUID(),

      truckId,
      truckName: stockItem.truckName,

      inventoryItemId,

      partNumber: stockItem.partNumber,
      description: stockItem.description,

      type: "Restoration",

      quantity: restoredQuantity,

      previousQuantity,
      newQuantity,

      notes: "Returned to truck stock.",

      createdDate: new Date().toISOString(),
      createdBy: "System",
    });
  }

  return updatedStockItem;
};
export const adjustTruckStockQuantity = (
  truckStockItemId: string,
  newQuantity: number,
  notes?: string
): TruckStockItem | null => {
  const truckStockItems = getTruckStockItems();

  const stockItem = truckStockItems.find(
    (item) => item.id === truckStockItemId
  );

  if (!stockItem) {
    return null;
  }

  const previousQuantity = stockItem.quantityOnTruck;
  const adjustedQuantity = Math.max(newQuantity, 0);

  const updatedStockItem = updateTruckStockItem(truckStockItemId, {
    quantityOnTruck: adjustedQuantity,
    lastCountDate: new Date().toISOString(),
    notes: notes || stockItem.notes,
  });

  if (updatedStockItem) {
    createTruckStockTransaction({
      id: crypto.randomUUID(),

      truckId: stockItem.truckId,
      truckName: stockItem.truckName,

      inventoryItemId: stockItem.inventoryItemId,

      partNumber: stockItem.partNumber,
      description: stockItem.description,

      type: "Adjustment",

      quantity: adjustedQuantity - previousQuantity,

      previousQuantity,
      newQuantity: adjustedQuantity,

      notes: notes || "Truck stock quantity adjusted.",

      createdDate: new Date().toISOString(),
      createdBy: "System",
    });
  }

  return updatedStockItem;
};