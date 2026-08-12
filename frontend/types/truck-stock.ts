export type TruckStatus = "Active" | "Inactive" | "Maintenance";

export type Truck = {
  id: string;

  truckNumber: string;
  name: string;

  assignedTechnicianId?: string;
  assignedTechnicianName?: string;

  vehicleId?: string;
  vin?: string;
  licensePlate?: string;

  status: TruckStatus;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};

export type TruckStockItem = {
  id: string;

  truckId: string;
  truckName: string;

  inventoryItemId: string;

  partNumber: string;
  description: string;

  quantityOnTruck: number;

  minimumQuantity?: number;
  idealQuantity?: number;

  binLocation?: string;

  lastCountDate?: string;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};