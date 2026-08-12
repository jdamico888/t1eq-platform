import type {
  InventoryLocation,
  InventoryLocationType,
} from "@/types/inventory-location";

import { getTrucks } from "@/services/truck-stock";

const STORAGE_KEY = "t1eq-inventory-locations";

const createId = () => {
  return `LOC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createTimestamp = () => {
  return new Date().toISOString();
};

export function getStoredInventoryLocations(): InventoryLocation[] {
  if (typeof window === "undefined") {
    return [];
  }

  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data) as InventoryLocation[];
  } catch (error) {
    console.error("Failed to parse inventory locations.", error);

    return [];
  }
}

export function saveStoredInventoryLocations(
  locations: InventoryLocation[]
): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
}

export function getInventoryLocations(): InventoryLocation[] {
  const warehouseLocation: InventoryLocation = {
    id: "warehouse",
    name: "Warehouse",
    type: "Warehouse",
    active: true,
    createdDate: "system",
  };

  const truckLocations: InventoryLocation[] = getTrucks()
    .filter((truck) => truck.status === "Active")
    .map((truck) => ({
      id: `truck:${truck.id}`,
      name: `${truck.name}${
        truck.licensePlate ? ` (${truck.licensePlate})` : ""
      }`,
      type: "Truck",
      truckId: truck.id,
      truckName: truck.name,
      licensePlate: truck.licensePlate,
      active: true,
      createdDate: truck.createdDate,
      updatedDate: truck.updatedDate,
    }));

  const customLocations = getStoredInventoryLocations().filter(
    (location) => location.active
  );

  return [warehouseLocation, ...truckLocations, ...customLocations];
}

export function createInventoryLocation(input: {
  name: string;
  type?: InventoryLocationType;
  notes?: string;
}): InventoryLocation {
  const timestamp = createTimestamp();

  const newLocation: InventoryLocation = {
    id: createId(),
    name: input.name,
    type: input.type ?? "Custom",
    active: true,
    notes: input.notes,
    createdDate: timestamp,
    updatedDate: timestamp,
  };

  const locations = getStoredInventoryLocations();

  saveStoredInventoryLocations([newLocation, ...locations]);

  return newLocation;
}

export function deleteInventoryLocation(locationId: string): void {
  saveStoredInventoryLocations(
    getStoredInventoryLocations().map((location) =>
      location.id === locationId
        ? {
            ...location,
            active: false,
            updatedDate: createTimestamp(),
          }
        : location
    )
  );
}