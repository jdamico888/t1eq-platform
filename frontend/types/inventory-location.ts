export type InventoryLocationType = "Warehouse" | "Truck" | "Custom";

export type InventoryLocation = {
  id: string;

  name: string;
  type: InventoryLocationType;

  truckId?: string;
  truckName?: string;
  licensePlate?: string;

  active: boolean;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};